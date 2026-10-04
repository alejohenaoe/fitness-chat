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

    # Reparto por objetivo: proteína en g por kg de peso; carbohidratos y grasas
    # como fracción de las calorías del día.
    _MACRO_SPLIT = {
        "weight_loss": (2.2, 0.35, 0.25),
        "muscle_gain": (2.0, 0.40, 0.20),
        "body_recomposition": (1.8, 0.35, 0.25),
        "athletic_performance": (2.0, 0.45, 0.20),
        "maintenance": (1.6, 0.40, 0.30),
    }

    def recalculate_targets(self):
        """Recalcula la meta de calorías y de macros con los datos actuales (no guarda)."""
        self.daily_calorie_target = self.calculate_tdee()
        protein_per_kg, carbs_share, fat_share = self._MACRO_SPLIT.get(self.goal, self._MACRO_SPLIT["maintenance"])
        self.protein_target_g = int(self.weight_kg * protein_per_kg)
        self.carbs_target_g = int(self.daily_calorie_target * carbs_share / 4)
        self.fat_target_g = int(self.daily_calorie_target * fat_share / 9)
