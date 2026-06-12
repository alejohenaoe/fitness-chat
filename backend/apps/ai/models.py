from django.db import models


class TrainingExample(models.Model):
    message_text = models.TextField()
    intent_label = models.CharField(max_length=50)
    confidence = models.FloatField(default=0.0)
    source = models.CharField(
        max_length=20,
        choices=[("predicted", "Predicted"), ("confirmed", "Confirmed")],
        default="predicted",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        indexes = [
            models.Index(fields=["is_active", "source"]),
        ]
