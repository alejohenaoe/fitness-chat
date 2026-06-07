from django.urls import path
from .views import DashboardTodayView, HistoryView

urlpatterns = [
    path("today/", DashboardTodayView.as_view()),
    path("history/", HistoryView.as_view()),
]
