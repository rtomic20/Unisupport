from rest_framework.routers import DefaultRouter
from .views import SupportPlanViewSet, SupportSessionViewSet

router = DefaultRouter()
router.register(r"plans", SupportPlanViewSet, basename="support-plan")
router.register(r"sessions", SupportSessionViewSet, basename="support-session")

urlpatterns = router.urls
