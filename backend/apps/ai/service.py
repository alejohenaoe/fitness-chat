from groq import Groq
from django.conf import settings
from datetime import datetime
from pathlib import Path
from string import Template
import json

_PROMPTS_DIR = Path(__file__).parent / "prompts"


def _load_template(filename: str) -> Template:
    return Template((_PROMPTS_DIR / filename).read_text(encoding="utf-8"))


class AIService:
    _system_tpl = _load_template("system_prompt.md")
    _summary_tpl = _load_template("daily_summary_prompt.md")

    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = "llama-3.3-70b-versatile"

    def process_user_message(
        self,
        user_message: str,
        user_profile,
        daily_context: dict,
        current_time: datetime,
    ) -> dict:
        system_prompt = self._build_system_prompt(
            user_profile, daily_context, current_time
        )
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                max_tokens=2000,
                temperature=0.7,
            )
            raw = response.choices[0].message.content
        except Exception as exc:
            raw = json.dumps({
                "message": f"No pude consultar Groq en este momento: {exc}",
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
        self, profile, daily_context: dict, current_time: datetime
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
        )
