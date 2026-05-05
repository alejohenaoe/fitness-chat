from django.db import models
from django.contrib.auth.models import User
from apps.chat.models import ChatSession, ChatMessage


class FoodItem(models.Model):
    name = models.CharField(max_length=120, unique=True)
    calories_per_100g = models.FloatField()
    protein_per_100g = models.FloatField(default=0)
    carbs_per_100g = models.FloatField(default=0)
    fat_per_100g = models.FloatField(default=0)


class MealLog(models.Model):
    MEAL_TYPES = [
        ("breakfast", "Desayuno"),
        ("morning_snack", "Media manana"),
        ("lunch", "Almuerzo"),
        ("afternoon_snack", "Merienda"),
        ("dinner", "Cena"),
        ("late_snack", "Snack"),
        ("beverage", "Bebida"),
        ("other", "Otro"),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="meal_logs")
    session = models.ForeignKey(
        ChatSession, on_delete=models.CASCADE, related_name="meal_logs"
    )
    source_message = models.ForeignKey(
        ChatMessage, on_delete=models.SET_NULL, null=True, blank=True
    )
    name = models.CharField(max_length=120)
    quantity_grams = models.FloatField(default=0)
    quantity_description = models.CharField(max_length=120, blank=True)
    meal_type = models.CharField(max_length=30, choices=MEAL_TYPES, default="other")
    calories = models.FloatField(default=0)
    protein_g = models.FloatField(default=0)
    carbs_g = models.FloatField(default=0)
    fat_g = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
