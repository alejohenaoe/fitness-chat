from django.db import models
from django.contrib.auth.models import User


class ChatSession(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="chat_sessions"
    )
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "date")
        ordering = ["-date"]


class ChatMessage(models.Model):
    ROLE_CHOICES = [("user", "User"), ("assistant", "Assistant")]
    MESSAGE_TYPE_CHOICES = [
        ("food_log", "Food Log"),
        ("exercise_log", "Exercise Log"),
        ("both", "Both"),
        ("analysis", "Analysis"),
        ("text", "Text"),
        ("summary", "Summary"),
    ]
    session = models.ForeignKey(
        ChatSession, on_delete=models.CASCADE, related_name="messages"
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    message_type = models.CharField(
        max_length=20, choices=MESSAGE_TYPE_CHOICES, default="text"
    )
    extracted_data = models.JSONField(default=dict, blank=True)
    nlp_processed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
