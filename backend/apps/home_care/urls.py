from rest_framework.routers import DefaultRouter
from .views import HomeAppointmentViewSet

router = DefaultRouter()
router.register(r"appointments", HomeAppointmentViewSet, basename="home-appointment")

urlpatterns = router.urls
