from rest_framework.routers import DefaultRouter
from .views import SurveyViewSet, SurveyResponseViewSet

router = DefaultRouter()
router.register(r"responses", SurveyResponseViewSet, basename="survey-response")
router.register(r"", SurveyViewSet, basename="survey")

urlpatterns = router.urls
