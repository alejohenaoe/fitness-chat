from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.users.urls_auth")),
    path("api/profile/", include("apps.users.urls_profile")),
    path("api/chat/", include("apps.chat.urls")),
    path("api/nutrition/", include("apps.nutrition.urls")),
    path("api/exercise/", include("apps.exercise.urls")),
    path("api/dashboard/", include("apps.users.urls_dashboard")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
