from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    GOAL_CHOICES = [
        ("weight_loss", "Perdida de peso"),
        ("muscle_gain", "Aumento de masa muscular"),
        ("body_recomposition", "Recomposicion corporal"),
        ("maintenance", "Mantenimiento"),
        ("athletic_performance", "Rendimiento deportivo"),
    ]
    ACTIVITY_LEVEL_CHOICES = [
        ("sedentary", "Sedentario"),
        ("light", "Ligero"),
        ("moderate", "Moderado"),
        ("active", "Activo"),
        ("very_active", "Muy activo"),
    ]
    GENDER_CHOICES = [("male", "Masculino"), ("female", "Femenino"), ("other", "Otro")]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    age = models.PositiveIntegerField(default=30)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default="other")
    weight_kg = models.FloatField(default=70)
    height_cm = models.FloatField(default=170)
    goal = models.CharField(max_length=30, choices=GOAL_CHOICES, default="maintenance")
    activity_level = models.CharField(
        max_length=20, choices=ACTIVITY_LEVEL_CHOICES, default="moderate"
    )
    timezone = models.CharField(max_length=64, default="America/Bogota")
    daily_calorie_target = models.IntegerField(default=2100)
    protein_target_g = models.IntegerField(default=130)
    carbs_target_g = models.IntegerField(default=230)
    fat_target_g = models.IntegerField(default=70)
    streak_days = models.PositiveIntegerField(default=0)

    def calculate_tdee(self):
        base = 10 * self.weight_kg + 6.25 * self.height_cm - 5 * self.age
        if self.gender == "male":
            base += 5
        elif self.gender == "female":
            base -= 161
        multipliers = {
            "sedentary": 1.2,
            "light": 1.375,
            "moderate": 1.55,
            "active": 1.725,
            "very_active": 1.9,
        }
        return int(base * multipliers.get(self.activity_level, 1.55))
