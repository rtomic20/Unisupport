from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RequestViewSet
from .reports import (
    RidesPerUserView,
    RidesPerDriverView,
    UnifiedReportView,
    ExportRidesCSVView,
    CareAppointmentsPerCaregiverView,
    SupportHoursPerAssistantView,
)

router = DefaultRouter()
router.register(r"requests", RequestViewSet, basename="requests")

urlpatterns = [
    path("", include(router.urls)),
    path("reports/rides-per-user/", RidesPerUserView.as_view(), name="rides_per_user"),
    path("reports/rides-per-driver/", RidesPerDriverView.as_view(), name="rides_per_driver"),
    path("reports/unified/", UnifiedReportView.as_view(), name="reports_unified"),
    path("reports/export-rides-csv/", ExportRidesCSVView.as_view(), name="export_rides_csv"),
    path("reports/care-per-caregiver/", CareAppointmentsPerCaregiverView.as_view(), name="care_per_caregiver"),
    path("reports/support-per-assistant/", SupportHoursPerAssistantView.as_view(), name="support_per_assistant"),
]
