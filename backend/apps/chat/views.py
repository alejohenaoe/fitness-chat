from datetime import datetime
from zoneinfo import ZoneInfo
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import ChatSession, ChatMessage
from .serializers import ChatSessionSerializer, ChatMessageSerializer
from .date_utils import resolve_event_date
from apps.ai.service import AIService
from apps.ai.classifier import IntentClassifier
from apps.ai.models import TrainingExample
from apps.nutrition.models import MealLog
from apps.nutrition.usda_service import USDAService
from apps.exercise.models import ExerciseLog

MET_VALUES = {
    "cardio": {"low": 6, "moderate": 8, "high": 10, "very_high": 12},
    "strength": {"low": 3, "moderate": 5, "high": 6, "very_high": 8},
    "hiit": {"low": 8, "moderate": 10, "high": 12, "very_high": 15},
    "yoga": {"low": 2, "moderate": 3, "high": 4, "very_high": 5},
    "walking": {"low": 2.5, "moderate": 3.5, "high": 4.5, "very_high": 5},
    "cycling": {"low": 4, "moderate": 6, "high": 8, "very_high": 10},
    "swimming": {"low": 5, "moderate": 7, "high": 9, "very_high": 11},
    "sports": {"low": 4, "moderate": 6, "high": 8, "very_high": 10},
    "flexibility": {"low": 2, "moderate": 2.5, "high": 3, "very_high": 4},
    "other": {"low": 3, "moderate": 4, "high": 5, "very_high": 6},
}

def calculate_calories_burned(exercise_type, intensity, duration_minutes, weight_kg):
    met = MET_VALUES.get(exercise_type, MET_VALUES["other"]).get(intensity, 4)
    hours = duration_minutes / 60
    return round(met * weight_kg * hours)


class ChatSessionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            ChatSessionSerializer(
                ChatSession.objects.filter(user=request.user), many=True
            ).data
        )


class ChatSessionTodayView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_tz = getattr(request.user.profile, "timezone", "America/Bogota") or "America/Bogota"
        today = datetime.now(ZoneInfo(user_tz)).date()
        session, _ = ChatSession.objects.get_or_create(
            user=request.user, date=today
        )
        return Response(ChatSessionSerializer(session).data)


class ChatSessionByDateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_date):
        session = get_object_or_404(ChatSession, user=request.user, date=session_date)
        return Response(ChatSessionSerializer(session).data)


class ChatSessionMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        session = get_object_or_404(ChatSession, id=session_id, user=request.user)
        return Response(ChatMessageSerializer(session.messages.all(), many=True).data)


class ChatMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        message_content = request.data.get("message", "").strip()
        if not message_content:
            return Response({"error": "El mensaje no puede estar vacio"}, status=400)
        user = request.user
        user_tz = getattr(user.profile, "timezone", "America/Bogota") or "America/Bogota"
        today = datetime.now(ZoneInfo(user_tz)).date()
        session, _ = ChatSession.objects.get_or_create(user=user, date=today)
        user_message = ChatMessage.objects.create(
            session=session, role="user", content=message_content
        )

        intent = IntentClassifier.classify(message_content)

        if intent == "generic":
            response_text = AIService().generate_generic_response(message_content)
            user_message.message_type = "text"
            user_message.nlp_processed = True
            user_message.save()
            assistant_message = ChatMessage.objects.create(
                session=session,
                role="assistant",
                content=response_text,
                message_type="text",
                extracted_data={},
            )
            totals = self._daily_context(user, today)
            target = user.profile.daily_calorie_target or 1
            net = totals["calories_consumed"] - totals["calories_burned"]
            return Response({
                "user_message": ChatMessageSerializer(user_message).data,
                "assistant_message": ChatMessageSerializer(assistant_message).data,
                "daily_update": {
                    **totals,
                    "net_calories": net,
                    "calorie_target": target,
                    "progress_pct": min(100, round((net / target) * 100)),
                },
                "foods_logged": [],
                "exercises_logged": [],
            })

        daily_context = self._daily_context(user, today)
        now = timezone.now()
        result = AIService().process_user_message(
            message_content, user.profile, daily_context, now
        )
        usda_svc = USDAService()

        enriched_foods = []
        if result.get("extracted_foods"):
            for food in result["extracted_foods"]:
                food = usda_svc.enrich_food(food)
                enriched_foods.append(food)
                event_date = resolve_event_date(food.get("event_date"), now, user_tz)
                event_session, _ = ChatSession.objects.get_or_create(user=user, date=event_date)
                occurred_at = timezone.make_aware(
                    datetime.combine(event_date, datetime.min.time()),
                    timezone=ZoneInfo(user_tz),
                ) if event_date != today else now
                MealLog.objects.create(
                    user=user,
                    session=event_session,
                    source_message=user_message,
                    name=food.get("name", "Alimento"),
                    quantity_grams=food.get("quantity_grams", 0),
                    quantity_description=food.get("quantity_description", ""),
                    meal_type=food.get("meal_type", "other"),
                    calories=food.get("calories_estimated", 0),
                    protein_g=food.get("protein_g", 0),
                    carbs_g=food.get("carbs_g", 0),
                    fat_g=food.get("fat_g", 0),
                    occurred_at=occurred_at,
                    nutrition_source=food.get("nutrition_source", "llm"),
                    nutrition_confidence=food.get("nutrition_confidence", "medium"),
                    usda_fdc_id=food.get("usda_fdc_id"),
                )
        saved_exercises = []
        if result.get("extracted_exercises"):
            for ex in result["extracted_exercises"]:
                calories_from_ai = ex.get("calories_burned_estimated", 0)
                if not calories_from_ai or calories_from_ai == 0:
                    calories_from_ai = calculate_calories_burned(
                        ex.get("exercise_type", "other"),
                        ex.get("intensity", "moderate"),
                        ex.get("duration_minutes", 0),
                        user.profile.weight_kg
                    )
                event_date = resolve_event_date(ex.get("event_date"), now, user_tz)
                event_session, _ = ChatSession.objects.get_or_create(user=user, date=event_date)
                occurred_at = timezone.make_aware(
                    datetime.combine(event_date, datetime.min.time()),
                    timezone=ZoneInfo(user_tz),
                ) if event_date != today else now
                exercise = ExerciseLog.objects.create(
                    user=user,
                    session=event_session,
                    source_message=user_message,
                    name=ex.get("name", "Ejercicio"),
                    exercise_type=ex.get("exercise_type", "other"),
                    duration_minutes=ex.get("duration_minutes", 0),
                    intensity=ex.get("intensity", "moderate"),
                    calories_burned=calories_from_ai,
                    notes=ex.get("notes", ""),
                    occurred_at=occurred_at,
                )
                saved_exercises.append(exercise)

        confirmed_type = result.get("message_type", "text")
        user_message.message_type = confirmed_type
        user_message.extracted_data = result
        user_message.nlp_processed = True
        user_message.save()
        TrainingExample.objects.filter(
            message_text=message_content, source="predicted"
        ).update(
            intent_label=confirmed_type,
            source="confirmed",
        )
        assistant_extracted = {
            "extracted_foods": result.get("extracted_foods", []),
            "extracted_exercises": result.get("extracted_exercises", []),
            "daily_analysis": result.get("daily_analysis", {}),
        }
        assistant_message = ChatMessage.objects.create(
            session=session,
            role="assistant",
            content=result.get("message", "No pude procesar esa informacion."),
            message_type=result.get("message_type", "text"),
            extracted_data=assistant_extracted,
        )
        totals = self._daily_context(user, today)
        target = user.profile.daily_calorie_target or 1
        net = totals["calories_consumed"] - totals["calories_burned"]
        exercises_logged = [
            {
                "name": e.name,
                "duration_minutes": e.duration_minutes,
                "calories_burned": e.calories_burned,
                "exercise_type": e.exercise_type,
                "intensity": e.intensity,
                "notes": e.notes,
                "calories_burned_estimated": e.calories_burned,
            }
            for e in saved_exercises
        ]
        return Response({
            "user_message": ChatMessageSerializer(user_message).data,
            "assistant_message": ChatMessageSerializer(assistant_message).data,
            "daily_update": {
                **totals,
                "net_calories": net,
                "calorie_target": target,
                "progress_pct": min(100, round((net / target) * 100)),
            },
            "foods_logged": enriched_foods,
            "exercises_logged": exercises_logged,
        })

    def _daily_context(self, user, day):
        meals = MealLog.objects.filter(user=user, occurred_at__date=day)
        exercises = ExerciseLog.objects.filter(user=user, occurred_at__date=day)
        return {
            "calories_consumed": meals.aggregate(v=Sum("calories"))["v"] or 0,
            "calories_burned": exercises.aggregate(v=Sum("calories_burned"))["v"] or 0,
            "protein_g": meals.aggregate(v=Sum("protein_g"))["v"] or 0,
            "carbs_g": meals.aggregate(v=Sum("carbs_g"))["v"] or 0,
            "fat_g": meals.aggregate(v=Sum("fat_g"))["v"] or 0,
            "meals_logged": list(meals.values("name", "meal_type", "calories")),
            "exercises_logged": list(exercises.values("name", "duration_minutes", "calories_burned", "exercise_type", "intensity")),
        }
