from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/accounts/", include("apps.accounts.urls_management")),
    path("api/", include("apps.requests_app.urls")),
    path("api/home-care/", include("apps.home_care.urls")),
    path("api/peer-support/", include("apps.peer_support.urls")),
    path("api/surveys/", include("apps.surveys.urls")),
]
