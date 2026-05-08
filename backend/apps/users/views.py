from datetime import date, timedelta
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
            .filter(user=request.user, created_at__date__gte=week_ago)
            .values("created_at__date")
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
        meals = MealLog.objects.filter(user=request.user, created_at__date=today)
        exercises = ExerciseLog.objects.filter(
            user=request.user, created_at__date=today
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
