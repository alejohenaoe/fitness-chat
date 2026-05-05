from django.urls import path
from .views import ProfileView, ProfileStatsView

urlpatterns = [
    path("", ProfileView.as_view()),
    path("stats/", ProfileStatsView.as_view()),
]
