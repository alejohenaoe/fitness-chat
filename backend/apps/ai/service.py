import base64
import json
import re
from datetime import datetime
from io import BytesIO
from pathlib import Path
from string import Template

from groq import Groq, RateLimitError
from django.conf import settings
from PIL import Image

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
    "openai/gpt-oss-120b",
    "qwen/qwen3.6-27b",
    "llama-3.1-8b-instant",
    "meta-llama/llama-4-scout-17b-16e-instruct",
]


class AIService:
    _system_tpl = _load_template("system_prompt.md")
    _summary_tpl = _load_template("daily_summary_prompt.md")
    _generic_tpl = _load_template("generic_prompt.md")

    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = "openai/gpt-oss-120b"

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

    def process_image(self, image_bytes: bytes, current_time: datetime) -> dict:
        img = Image.open(BytesIO(image_bytes))
        max_dim = 1200
        if img.width > max_dim or img.height > max_dim:
            ratio = min(max_dim / img.width, max_dim / img.height)
            new_w = int(img.width * ratio)
            new_h = int(img.height * ratio)
            img = img.resize((new_w, new_h), Image.LANCZOS)

        buffer = BytesIO()
        img.convert("RGB").save(buffer, format="JPEG", quality=85)
        base64_image = base64.b64encode(buffer.getvalue()).decode("utf-8")

        prompt = (
            "Eres NutriCoach, un asistente de nutrición experto.\n\n"
            "El usuario tomó una foto de la etiqueta nutricional de un producto.\n\n"
            "Extrae la información nutricional de esta etiqueta. Sigue estas reglas ESTRICTAMENTE:\n\n"
            "1. quantity_grams = el tamaño de la porción en gramos que indica la etiqueta EXACTAMENTE.\n"
            "2. calories_estimated, protein_g, carbs_g, fat_g = los valores PARA ESE quantity_grams, NO por 100g.\n"
            "3. Si la etiqueta muestra dos columnas (por porción y por 100g), usa los valores de la columna 'por porción'.\n"
            "4. Si la etiqueta solo muestra valores por 100g, pon quantity_grams=100 y usa esos valores.\n"
            "5. Verifica que los números sean consistentes: si quantity_grams=40 y el producto tiene 433kcal/100g, "
            "entonces calories_estimated debe ser ~173 (el cálculo 433*40/100 redondeado), NO 433.\n\n"
            "Devuelve SOLO JSON sin markdown, sin backticks, con esta estructura:\n"
            '{\n'
            '  "message": "Resumen en español de lo que se encontró en la etiqueta",\n'
            '  "extracted_foods": [{\n'
            '    "name": "Nombre del producto en español",\n'
            '    "name_en": "Nombre del producto en inglés para búsqueda USDA",\n'
            '    "quantity_grams": SOLO_EL_NUMERO_EJ_40,\n'
            '    "quantity_description": "ej: 1 porción (40g)",\n'
            '    "meal_type": "other",\n'
            '    "calories_estimated": calorías PARA_quantity_grams_NO_para_100g,\n'
            '    "protein_g": proteína_g_PARA_quantity_grams,\n'
            '    "carbs_g": carbohidratos_g_PARA_quantity_grams,\n'
            '    "fat_g": grasa_g_PARA_quantity_grams,\n'
            '    "confidence": "high",\n'
            '    "event_date": null\n'
            '  }],\n'
            '  "extracted_exercises": [],\n'
            '  "message_type": "food_log",\n'
            '  "daily_analysis": {\n'
            '    "status": "on_track",\n'
            '    "short_message": "",\n'
            '    "recommendations": [],\n'
            '    "next_meal_suggestion": ""\n'
            '  }\n'
            '}'
        )

        try:
            response = self.client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"},
                            },
                        ],
                    }
                ],
                max_tokens=2000,
                temperature=0.3,
                response_format={"type": "json_object"},
            )
            raw = response.choices[0].message.content
        except Exception:
            raw = json.dumps({
                "message": "No pude leer la etiqueta. Intenta tomar una foto más clara.",
                "extracted_foods": [],
                "extracted_exercises": [],
                "message_type": "text",
                "daily_analysis": {
                    "status": "on_track", "short_message": "", "recommendations": [], "next_meal_suggestion": "",
                },
            })

        raw = raw.strip()
        if raw.startswith("```json"):
            raw = raw[7:]
        if raw.startswith("```"):
            raw = raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()

        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {
                "message": raw,
                "extracted_foods": [],
                "extracted_exercises": [],
                "message_type": "text",
                "daily_analysis": {
                    "status": "on_track", "short_message": "", "recommendations": [], "next_meal_suggestion": "",
                },
            }

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
