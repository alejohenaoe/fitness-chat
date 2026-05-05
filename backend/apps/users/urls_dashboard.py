from django.urls import path
from .views import DashboardTodayView

urlpatterns = [path("today/", DashboardTodayView.as_view())]
