from django.db import models
from django.contrib.auth.models import User
from apps.chat.models import ChatSession, ChatMessage


class ExerciseLog(models.Model):
    EXERCISE_TYPES = [
        ("cardio", "Cardio"),
        ("strength", "Strength"),
        ("hiit", "HIIT"),
        ("yoga", "Yoga"),
        ("sports", "Sports"),
        ("walking", "Walking"),
        ("cycling", "Cycling"),
        ("swimming", "Swimming"),
        ("flexibility", "Flexibility"),
        ("other", "Other"),
    ]
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="exercise_logs"
    )
    session = models.ForeignKey(
        ChatSession, on_delete=models.CASCADE, related_name="exercise_logs"
    )
    source_message = models.ForeignKey(
        ChatMessage, on_delete=models.SET_NULL, null=True, blank=True
    )
    name = models.CharField(max_length=120)
    exercise_type = models.CharField(
        max_length=20, choices=EXERCISE_TYPES, default="other"
    )
    duration_minutes = models.IntegerField(default=0)
    intensity = models.CharField(max_length=20, default="moderate")
    calories_burned = models.FloatField(default=0)
    estimated = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
