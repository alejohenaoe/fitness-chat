from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo
from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import ExerciseLog
from .serializers import ExerciseLogSerializer


def _tz_day_range(day):
    tz = ZoneInfo("America/Bogota")
    start = datetime.combine(day, time.min, tzinfo=tz)
    return start, start + timedelta(days=1)


class ExerciseTodayView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start, end = _tz_day_range(date.today())
        logs = ExerciseLog.objects.filter(
            user=request.user, occurred_at__gte=start, occurred_at__lt=end
        )
        return Response({"logs": ExerciseLogSerializer(logs, many=True).data})


class ExerciseByDateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, log_date):
        start, end = _tz_day_range(log_date)
        logs = ExerciseLog.objects.filter(user=request.user, occurred_at__gte=start, occurred_at__lt=end)
        return Response({"logs": ExerciseLogSerializer(logs, many=True).data})


class ExerciseDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, log_id):
        deleted = ExerciseLog.objects.filter(id=log_id, user=request.user).delete()
        if not deleted[0]:
            return Response({"error": "Registro no encontrado"}, status=404)
        today = date.today()
        totals = self._daily_totals(request.user, today)
        return Response({
            "message": "Registro eliminado",
            "daily_update": totals,
        })

    def _daily_totals(self, user, day):
        from apps.nutrition.models import MealLog
        start, end = _tz_day_range(day)
        meals = MealLog.objects.filter(user=user, occurred_at__gte=start, occurred_at__lt=end)
        exercises = ExerciseLog.objects.filter(user=user, occurred_at__gte=start, occurred_at__lt=end)
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


class ExerciseSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_day = date.today() - timedelta(days=6)
        start, _ = _tz_day_range(start_day)
        logs = ExerciseLog.objects.filter(
            user=request.user, occurred_at__gte=start
        )
        return Response({
            "total_burned": logs.aggregate(v=Sum("calories_burned"))["v"] or 0,
            "logs": ExerciseLogSerializer(logs, many=True).data,
        })
