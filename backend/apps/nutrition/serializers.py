from rest_framework import serializers
from .models import FoodItem, MealLog


class FoodItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodItem
        fields = "__all__"


class MealLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealLog
        fields = "__all__"
