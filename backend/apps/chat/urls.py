from django.urls import path
from .views import (
    ChatSessionsView,
    ChatSessionTodayView,
    ChatSessionByDateView,
    ChatMessageView,
    ChatSessionMessagesView,
)

urlpatterns = [
    path("sessions/", ChatSessionsView.as_view()),
    path("sessions/today/", ChatSessionTodayView.as_view()),
    path("sessions/<str:session_date>/", ChatSessionByDateView.as_view()),
    path("sessions/<int:session_id>/messages/", ChatSessionMessagesView.as_view()),
    path("message/", ChatMessageView.as_view()),
]
