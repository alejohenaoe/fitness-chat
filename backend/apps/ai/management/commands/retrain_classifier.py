from django.core.management.base import BaseCommand
from apps.ai.classifier import IntentClassifier


class Command(BaseCommand):
    help = "Retrain the intent classifier on all confirmed training examples"

    def handle(self, *args, **options):
        IntentClassifier.retrain()
        self.stdout.write(self.style.SUCCESS("Classifier retrained successfully"))
