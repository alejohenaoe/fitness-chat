from groq import Groq, RateLimitError
from django.conf import settings
from datetime import datetime
from pathlib import Path
from string import Template
import json
import re

_PROMPTS_DIR = Path(__file__).parent / "prompts"


def _load_template(filename: str) -> Template:
    return Template((_PROMPTS_DIR / filename).read_text(encoding="utf-8"))


def _format_retry_time(error: RateLimitError) -> str:
    msg = str(error)
    match = re.search(r"Please try again in ([\dhms.]+)", msg)
    if not match:
        return ""
    raw = match.group(1)
    hours = re.search(r"(\d+)h", raw)
    minutes = re.search(r"(\d+)m", raw)
    seconds = re.search(r"(\d+\.?\d*)s", raw)
    parts = []
    if hours:
        parts.append(f"{hours.group(1)}h")
    if minutes:
        parts.append(f"{minutes.group(1)}m")
    if seconds:
        sec = round(float(seconds.group(1)))
        parts.append(f"{sec}s")
    return " ".join(parts)


_FALLBACK_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "meta-llama/llama-4-scout-17b-16e-instruct",
]


class AIService:
    _system_tpl = _load_template("system_prompt.md")
    _summary_tpl = _load_template("daily_summary_prompt.md")
    _generic_tpl = _load_template("generic_prompt.md")

    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = "llama-3.3-70b-versatile"

    def generate_generic_response(self, user_message: str) -> str:
        system_prompt = self._generic_tpl.substitute()
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                max_tokens=1000,
                temperature=0.7,
            )
            return response.choices[0].message.content.strip()
        except Exception as exc:
            return f"Lo siento, no pude responder en este momento: {exc}"

    def process_user_message(
        self,
        user_message: str,
        user_profile,
        daily_context: dict,
        current_time: datetime,
        user_mode: str = "food",
    ) -> dict:
        system_prompt = self._build_system_prompt(
            user_profile, daily_context, current_time, user_mode
        )

        last_error = None
        for model in _FALLBACK_MODELS:
            try:
                response = self.client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message},
                    ],
                    max_tokens=2000,
                    temperature=0.7,
                )
                raw = response.choices[0].message.content
                last_error = None
                break
            except RateLimitError as e:
                last_error = e
                continue
            except Exception as e:
                last_error = e
                break

        if last_error:
            if isinstance(last_error, RateLimitError):
                retry_time = _format_retry_time(last_error)
                if retry_time:
                    message = f"He alcanzado mi límite de consultas por hoy. Vuelve a intentar en {retry_time}."
                else:
                    message = "He alcanzado mi límite de consultas por hoy. Vuelve a intentar más tarde."
            else:
                message = "Ocurrió un error al procesar tu mensaje. Intenta de nuevo."
            raw = json.dumps({
                "message": message,
                "extracted_foods": [],
                "extracted_exercises": [],
                "message_type": "text",
                "daily_analysis": {
                    "status": "on_track",
                    "short_message": "",
                    "recommendations": [],
                    "next_meal_suggestion": "",
                },
            })

        # Limpiar posibles bloques markdown que el modelo anada
        raw = raw.strip()
        if raw.startswith("```json"):
            raw = raw[7:]
        if raw.startswith("```"):
            raw = raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()

        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            parsed = {
                "message": raw,
                "extracted_foods": [],
                "extracted_exercises": [],
                "message_type": "text",
                "daily_analysis": {
                    "status": "on_track",
                    "short_message": "",
                    "recommendations": [],
                    "next_meal_suggestion": "",
                },
            }
        return parsed

    def generate_daily_summary(
        self, profile, daily_data: dict, current_time: datetime
    ) -> str:
        prompt = self._summary_tpl.substitute(
            calories_consumed=f"{daily_data['calories_consumed']:.0f}",
            calorie_target=profile.daily_calorie_target,
            progress_pct=f"{daily_data['progress_pct']:.0f}",
            protein_g=f"{daily_data['protein_g']:.0f}",
            carbs_g=f"{daily_data['carbs_g']:.0f}",
            fat_g=f"{daily_data['fat_g']:.0f}",
            calories_burned=f"{daily_data['calories_burned']:.0f}",
            net_calories=f"{daily_data['net_calories']:.0f}",
            goal=profile.goal,
            meals_list=daily_data["meals_list"],
            exercises_summary=daily_data["exercises_summary"],
        )
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=600,
            temperature=0.7,
        )
        return response.choices[0].message.content

    def _get_meal_period(self, hour: int) -> str:
        if 5 <= hour < 10:
            return "hora de desayuno"
        elif 10 <= hour < 12:
            return "media mañana"
        elif 12 <= hour < 15:
            return "hora de almuerzo"
        elif 15 <= hour < 18:
            return "tarde/merienda"
        elif 18 <= hour < 21:
            return "hora de cena"
        else:
            return "noche"

    def _build_system_prompt(
        self, profile, daily_context: dict, current_time: datetime, user_mode: str = "food"
    ) -> str:
        hour = current_time.hour
        calories_consumed = daily_context.get("calories_consumed", 0)
        calories_burned = daily_context.get("calories_burned", 0)
        calorie_target = profile.daily_calorie_target or 2000
        net_calories = calories_consumed - calories_burned
        remaining_calories = calorie_target - net_calories
        progress_pct = (
            min(100, round((net_calories / calorie_target) * 100))
            if calorie_target
            else 0
        )

        goal_labels = {
            "weight_loss": "pérdida de peso",
            "muscle_gain": "aumento de masa muscular",
            "body_recomposition": "recomposición corporal",
            "maintenance": "mantenimiento",
            "athletic_performance": "rendimiento deportivo",
        }

        return self._system_tpl.substitute(
            first_name=getattr(profile.user, "first_name", "") or "el usuario",
            goal_label=goal_labels.get(profile.goal, profile.goal),
            calorie_target=calorie_target,
            current_date=current_time.strftime("%Y-%m-%d"),
            current_time=current_time.strftime("%H:%M"),
            meal_period=self._get_meal_period(hour),
            calories_consumed=f"{calories_consumed:.0f}",
            calories_burned=f"{calories_burned:.0f}",
            net_calories=f"{net_calories:.0f}",
            remaining_calories=f"{remaining_calories:.0f}",
            progress_pct=progress_pct,
            meals_logged=daily_context.get("meals_logged", []),
            exercises_logged=daily_context.get("exercises_logged", []),
            protein_target=profile.protein_target_g or "No definida",
            carbs_target=profile.carbs_target_g or "No definido",
            fat_target=profile.fat_target_g or "No definida",
            protein_consumed=f"{daily_context.get('protein_g', 0):.0f}",
            carbs_consumed=f"{daily_context.get('carbs_g', 0):.0f}",
            fat_consumed=f"{daily_context.get('fat_g', 0):.0f}",
            weight_kg=profile.weight_kg,
            user_mode=user_mode,
        )
