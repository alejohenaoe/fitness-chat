from datetime import date, timedelta
from django.db import models
from django.db.models import Avg, Sum
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import UserProfile
from .serializers import RegisterSerializer, UserSerializer, UserProfileSerializer
from apps.nutrition.models import MealLog
from apps.exercise.models import ExerciseLog


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = RegisterSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.save()
        refresh = RefreshToken.for_user(user)  # type: ignore
        return Response({
            "user": UserSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        })


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from django.contrib.auth import authenticate

        user = authenticate(
            username=request.data.get("email"), password=request.data.get("password")
        )
        if not user:
            return Response({"error": "Credenciales invalidas"}, status=401)
        refresh = RefreshToken.for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        })


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            RefreshToken(request.data.get("refresh")).blacklist()
        except Exception:
            pass
        return Response({"detail": "Logout OK"})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserProfileSerializer(request.user.profile).data)

    def put(self, request):
        s = UserProfileSerializer(request.user.profile, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        profile: UserProfile = s.save()

        # Recalculate TDEE
        profile.daily_calorie_target = profile.calculate_tdee()

        # Auto-calculate macros based on goal
        weight = profile.weight_kg
        calories = profile.daily_calorie_target

        if profile.goal == "weight_loss":
            profile.protein_target_g = int(weight * 2.2)
            profile.carbs_target_g = int(calories * 0.35 / 4)
            profile.fat_target_g = int(calories * 0.25 / 9)
        elif profile.goal == "muscle_gain":
            profile.protein_target_g = int(weight * 2.0)
            profile.carbs_target_g = int(calories * 0.40 / 4)
            profile.fat_target_g = int(calories * 0.20 / 9)
        elif profile.goal == "body_recomposition":
            profile.protein_target_g = int(weight * 1.8)
            profile.carbs_target_g = int(calories * 0.35 / 4)
            profile.fat_target_g = int(calories * 0.25 / 9)
        elif profile.goal == "athletic_performance":
            profile.protein_target_g = int(weight * 2.0)
            profile.carbs_target_g = int(calories * 0.45 / 4)
            profile.fat_target_g = int(calories * 0.20 / 9)
        else:  # maintenance
            profile.protein_target_g = int(weight * 1.6)
            profile.carbs_target_g = int(calories * 0.40 / 4)
            profile.fat_target_g = int(calories * 0.30 / 9)

        profile.save()
        return Response(UserProfileSerializer(profile).data)


class ProfileStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        week_ago = date.today() - timedelta(days=7)
        avg_cal = (
            MealLog.objects
            .filter(user=request.user, occurred_at__date__gte=week_ago)
            .values("occurred_at__date")
            .annotate(total=Sum("calories"))
            .aggregate(v=Avg("total"))["v"]
            or 0
        )
        return Response({
            "streak_days": request.user.profile.streak_days,
            "weekly_avg_calories": round(avg_cal, 1),
        })


class UserDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user
        user.delete()
        return Response({"detail": "Cuenta eliminada"})


class DashboardTodayView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        meals = MealLog.objects.filter(user=request.user, occurred_at__date=today)
        exercises = ExerciseLog.objects.filter(
            user=request.user, occurred_at__date=today
        )
        consumed = meals.aggregate(v=Sum("calories"))["v"] or 0
        burned = exercises.aggregate(v=Sum("calories_burned"))["v"] or 0
        target = request.user.profile.daily_calorie_target or 1
        net = consumed - burned
        return Response({
            "calories_consumed": consumed,
            "calories_burned": burned,
            "net_calories": net,
            "calorie_target": target,
            "progress_pct": min(100, round((net / target) * 100)),
            "protein_g": meals.aggregate(v=Sum("protein_g"))["v"] or 0,
            "carbs_g": meals.aggregate(v=Sum("carbs_g"))["v"] or 0,
            "fat_g": meals.aggregate(v=Sum("fat_g"))["v"] or 0,
            "meals": list(meals.values("id", "name", "meal_type", "calories")),
            "exercises": list(
                exercises.values("id", "name", "duration_minutes", "calories_burned")
            ),
        })


class HistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        target = user.profile.daily_calorie_target or 1

        start_date_str = request.query_params.get("start_date")
        end_date_str = request.query_params.get("end_date")

        if start_date_str and end_date_str:
            try:
                start = date.fromisoformat(start_date_str)
                end = date.fromisoformat(end_date_str)
            except (ValueError, TypeError):
                return Response({"error": "Formato de fecha inválido. Use YYYY-MM-DD."}, status=400)
            if start > end:
                return Response({"error": "start_date debe ser anterior a end_date."}, status=400)
        else:
            try:
                days = max(1, min(365, int(request.query_params.get("days", 30))))
            except (ValueError, TypeError):
                days = 30
            end = date.today()
            start = end - timedelta(days=days - 1)

        total_days = (end - start).days + 1
        all_dates = [start + timedelta(days=i) for i in range(total_days)]

        meals_qs = (
            MealLog.objects
            .filter(user=user, occurred_at__date__gte=start, occurred_at__date__lte=end)
            .values("occurred_at__date")
            .annotate(
                calories_consumed=Sum("calories"),
                protein_g=Sum("protein_g"),
                carbs_g=Sum("carbs_g"),
                fat_g=Sum("fat_g"),
                meals_count=models.Count("id"),
            )
        )
        exercises_qs = (
            ExerciseLog.objects
            .filter(user=user, occurred_at__date__gte=start, occurred_at__date__lte=end)
            .values("occurred_at__date")
            .annotate(
                calories_burned=Sum("calories_burned"),
                exercises_count=models.Count("id"),
            )
        )

        meal_map = {r["occurred_at__date"]: r for r in meals_qs}
        ex_map = {r["occurred_at__date"]: r for r in exercises_qs}

        result = []
        registered_days = 0
        total_net_calories = 0

        for d in all_dates:
            m = meal_map.get(d, {})
            e = ex_map.get(d, {})
            consumed = m.get("calories_consumed") or 0
            burned = e.get("calories_burned") or 0
            net = consumed - burned
            meals_count = m.get("meals_count") or 0

            if meals_count > 0:
                registered_days += 1
            total_net_calories += net

            result.append({
                "date": d.isoformat(),
                "calories_consumed": round(consumed),
                "calories_burned": round(burned),
                "net_calories": round(net),
                "calorie_target": target,
                "progress_pct": min(100, round((net / target) * 100)) if target > 0 else 0,
                "protein_g": round(m.get("protein_g") or 0, 1),
                "carbs_g": round(m.get("carbs_g") or 0, 1),
                "fat_g": round(m.get("fat_g") or 0, 1),
                "meals_count": meals_count,
                "exercises_count": e.get("exercises_count") or 0,
            })

        avg_calories = round(total_net_calories / total_days) if total_days > 0 else 0

        # Previous period average
        period_len = total_days
        prev_end = start - timedelta(days=1)
        prev_start = prev_end - timedelta(days=period_len - 1)

        prev_meals_qs = (
            MealLog.objects
            .filter(user=user, occurred_at__date__gte=prev_start, occurred_at__date__lte=prev_end)
            .values("occurred_at__date")
            .annotate(calories_consumed=Sum("calories"))
        )
        prev_exercises_qs = (
            ExerciseLog.objects
            .filter(user=user, occurred_at__date__gte=prev_start, occurred_at__date__lte=prev_end)
            .values("occurred_at__date")
            .annotate(calories_burned=Sum("calories_burned"))
        )

        prev_meal_map = {r["occurred_at__date"]: r for r in prev_meals_qs}
        prev_ex_map = {r["occurred_at__date"]: r for r in prev_exercises_qs}
        prev_all_dates = [prev_start + timedelta(days=i) for i in range(period_len)]

        prev_total_net = 0
        for d in prev_all_dates:
            m = prev_meal_map.get(d, {})
            e = prev_ex_map.get(d, {})
            consumed = m.get("calories_consumed") or 0
            burned = e.get("calories_burned") or 0
            prev_total_net += consumed - burned

        previous_avg_calories = round(prev_total_net / period_len) if period_len > 0 else 0

        return Response({
            "days": result,
            "calorie_target": target,
            "period_summary": {
                "avg_calories": avg_calories,
                "registered_days": registered_days,
                "total_days": total_days,
                "streak_days": user.profile.streak_days,
            },
            "previous_avg_calories": previous_avg_calories,
        })
