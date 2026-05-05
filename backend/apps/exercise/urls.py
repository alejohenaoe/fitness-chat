from django.urls import path
from .views import (
    ExerciseTodayView,
    ExerciseByDateView,
    ExerciseDeleteView,
    ExerciseSummaryView,
)

urlpatterns = [
    path("today/", ExerciseTodayView.as_view()),
    path("date/<str:log_date>/", ExerciseByDateView.as_view()),
    path("log/<int:log_id>/", ExerciseDeleteView.as_view()),
    path("summary/", ExerciseSummaryView.as_view()),
]
