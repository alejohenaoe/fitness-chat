from datetime import date, timedelta
from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import MealLog
from .serializers import MealLogSerializer


class NutritionTodayView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        logs = MealLog.objects.filter(user=request.user, created_at__date=date.today())
        return Response({"logs": MealLogSerializer(logs, many=True).data})


class NutritionByDateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, log_date):
        logs = MealLog.objects.filter(user=request.user, created_at__date=log_date)
        return Response({"logs": MealLogSerializer(logs, many=True).data})


class NutritionWeeklyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start = date.today() - timedelta(days=6)
        logs = MealLog.objects.filter(user=request.user, created_at__date__gte=start)
        return Response({
            "total_calories": logs.aggregate(v=Sum("calories"))["v"] or 0,
            "items": MealLogSerializer(logs, many=True).data,
        })


class MealDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, meal_id):
        deleted = MealLog.objects.filter(id=meal_id, user=request.user).delete()
        if not deleted[0]:
            return Response({"error": "Registro no encontrado"}, status=404)
        today = date.today()
        totals = self._daily_totals(request.user, today)
        return Response({
            "message": "Registro eliminado",
            "daily_update": totals,
        })

    def _daily_totals(self, user, day):
        from apps.exercise.models import ExerciseLog
        meals = MealLog.objects.filter(user=user, created_at__date=day)
        exercises = ExerciseLog.objects.filter(user=user, created_at__date=day)
        consumed = meals.aggregate(v=Sum("calories"))["v"] or 0
        burned = exercises.aggregate(v=Sum("calories_burned"))["v"] or 0
        target = user.profile.daily_calorie_target or 1
        net = consumed - burned
        return {
            "calories_consumed": consumed,
            "calories_burned": burned,
            "protein_g": meals.aggregate(v=Sum("protein_g"))["v"] or 0,
            "carbs_g": meals.aggregate(v=Sum("carbs_g"))["v"] or 0,
            "fat_g": meals.aggregate(v=Sum("fat_g"))["v"] or 0,
            "net_calories": net,
            "calorie_target": target,
            "progress_pct": min(100, round((net / target) * 100)),
        }


class NutritionProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        consumed = (
            MealLog.objects.filter(
                user=request.user, created_at__date=date.today()
            ).aggregate(v=Sum("calories"))["v"]
            or 0
        )
        target = request.user.profile.daily_calorie_target or 1
        return Response({
            "consumed": consumed,
            "target": target,
            "progress_pct": min(100, round((consumed / target) * 100)),
        })
