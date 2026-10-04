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

    _ACTIVITY_MULTIPLIERS = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "very_active": 1.9,
    }

    # Ajuste de calorías y reparto de macros por objetivo:
    # (factor sobre el gasto diario, proteína en g/kg, fracción de calorías para grasa).
    # Los carbohidratos son "el resto", así los macros siempre suman la meta.
    # Respaldo: déficit moderado para perder peso (Jensen 2014; Helms 2014), superávit
    # pequeño para ganar músculo (Iraki 2019), recomposición con déficit leve (Barakat 2020),
    # proteína 1,6–2,2 g/kg (Jäger 2017; Morton 2018), grasa 20–35 % (IOM 2005).
    # La proteína es la mitad del rango con respaldo para cada objetivo:
    # perder peso y recomposición 1,6–2,4 (ISSN 2017; Helms 2014), ganar músculo 1,6–2,2
    # (Morton 2018), mantenerse 1,4–2,0 (ISSN 2017), rendimiento 1,2–2,0 (ACSM/AND/DC 2016).
    _GOAL_PLAN = {
        "weight_loss": (0.80, 2.0, 0.25),
        "muscle_gain": (1.10, 1.9, 0.25),
        "body_recomposition": (0.90, 2.0, 0.25),
        "maintenance": (1.00, 1.7, 0.30),
        "athletic_performance": (1.00, 1.6, 0.25),
    }
    # Mínimos de seguridad sin supervisión profesional (Jensen 2014).
    _MIN_KCAL = {"male": 1500, "female": 1200}
    _MIN_FAT_G_PER_KG = 0.6

    def calculate_bmr(self):
        """Metabolismo basal con Mifflin-St Jeor."""
        base = 10 * self.weight_kg + 6.25 * self.height_cm - 5 * self.age
        if self.gender == "male":
            base += 5
        elif self.gender == "female":
            base -= 161
        return base

    def calculate_tdee(self):
        """Gasto diario estimado (mantenimiento): metabolismo basal × actividad."""
        return int(self.calculate_bmr() * self._ACTIVITY_MULTIPLIERS.get(self.activity_level, 1.55))

    def protein_reference_weight(self):
        """Con IMC ≥ 30 la proteína se calcula sobre el peso que daría un IMC de 25."""
        height_m = self.height_cm / 100
        if height_m > 0 and self.weight_kg / height_m ** 2 >= 30:
            return 25 * height_m ** 2
        return self.weight_kg

    def recalculate_targets(self):
        """Recalcula la meta de calorías y de macros con los datos actuales (no guarda)."""
        factor, protein_per_kg, fat_share = self._GOAL_PLAN.get(self.goal, self._GOAL_PLAN["maintenance"])
        floor = max(self.calculate_bmr(), self._MIN_KCAL.get(self.gender, 1200))
        kcal = max(round(self.calculate_tdee() * factor), round(floor))

        protein_g = round(self.protein_reference_weight() * protein_per_kg)
        fat_g = max(round(kcal * fat_share / 9), round(self.weight_kg * self._MIN_FAT_G_PER_KG))
        carbs_g = max(0, round((kcal - protein_g * 4 - fat_g * 9) / 4))

        self.daily_calorie_target = kcal
        self.protein_target_g = protein_g
        self.fat_target_g = fat_g
        self.carbs_target_g = carbs_g
