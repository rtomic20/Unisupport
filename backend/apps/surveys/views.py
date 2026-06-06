from django.db import IntegrityError
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action

from apps.accounts.permissions import IsAdmin
from .models import Survey, SurveyResponse
from .serializers import SurveySerializer, SurveyResponseSerializer


class SurveyViewSet(ModelViewSet):
    serializer_class = SurveySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Survey.objects.prefetch_related("questions", "responses")
        if user.role_name != "admin":
            qs = qs.filter(is_active=True)
        return qs

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated, IsAdmin])
    def responses(self, request, pk=None):
        survey = self.get_object()
        responses = SurveyResponse.objects.filter(survey=survey).select_related("student").prefetch_related("answers")
        serializer = SurveyResponseSerializer(responses, many=True)
        return Response(serializer.data)


class SurveyResponseViewSet(ModelViewSet):
    serializer_class = SurveyResponseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role_name == "admin":
            return SurveyResponse.objects.select_related("student", "survey").prefetch_related("answers")
        return SurveyResponse.objects.filter(student=user).select_related("survey").prefetch_related("answers")

    def perform_create(self, serializer):
        survey = serializer.validated_data.get("survey")
        if SurveyResponse.objects.filter(survey=survey, student=self.request.user).exists():
            raise ValidationError({"detail": "Već ste ispunili ovu anketu."})
        try:
            serializer.save(student=self.request.user)
        except IntegrityError:
            raise ValidationError({"detail": "Već ste ispunili ovu anketu."})

    def get_permissions(self):
        if self.action == "destroy":
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]
