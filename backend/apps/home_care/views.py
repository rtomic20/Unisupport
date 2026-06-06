from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.accounts.models import CustomUser
from apps.accounts.permissions import IsAdmin
from .models import HomeAppointment
from .serializers import HomeAppointmentSerializer


class HomeAppointmentViewSet(ModelViewSet):
    serializer_class = HomeAppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = user.role_name
        qs = HomeAppointment.objects.select_related("student", "caregiver")

        if role == "admin":
            pass
        elif role == "student":
            qs = qs.filter(student=user)
        elif role == "caregiver":
            qs = qs.filter(caregiver=user)
        else:
            qs = qs.none()

        date = self.request.query_params.get("date")
        if date:
            qs = qs.filter(appointment_date=date)

        student_id = self.request.query_params.get("student_id")
        if student_id:
            qs = qs.filter(student_id=student_id)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role_name == "student":
            serializer.save(student=user)
        else:
            serializer.save()

    def get_permissions(self):
        if self.action == "destroy":
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdmin])
    def assign_caregiver(self, request, pk=None):
        appt = self.get_object()
        caregiver_id = request.data.get("caregiver_id")
        if not caregiver_id:
            return Response({"detail": "caregiver_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            caregiver = CustomUser.objects.get(user_id=caregiver_id, role__role_name="caregiver")
        except CustomUser.DoesNotExist:
            return Response({"detail": "Caregiver not found."}, status=status.HTTP_404_NOT_FOUND)
        appt.caregiver = caregiver
        appt.status = "assigned"
        appt.save()
        return Response(HomeAppointmentSerializer(appt).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def complete(self, request, pk=None):
        appt = self.get_object()
        if appt.status not in ("pending", "assigned"):
            return Response({"detail": "Nije moguće završiti termin u ovom statusu."}, status=status.HTTP_400_BAD_REQUEST)
        appt.status = "completed"
        appt.save()
        return Response(HomeAppointmentSerializer(appt).data)
