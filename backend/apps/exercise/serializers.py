from rest_framework import serializers
from .models import ExerciseLog


class ExerciseLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseLog
        fields = "__all__"
