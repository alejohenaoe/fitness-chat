from django.urls import path
from .views import NutritionTodayView, NutritionByDateView, NutritionWeeklyView, MealDeleteView, NutritionProgressView

urlpatterns = [
    path('today/', NutritionTodayView.as_view()),
    path('date/<str:log_date>/', NutritionByDateView.as_view()),
    path('weekly/', NutritionWeeklyView.as_view()),
    path('meal/<int:meal_id>/', MealDeleteView.as_view()),
    path('progress/', NutritionProgressView.as_view()),
]
