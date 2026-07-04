from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.accounts.models import CustomUser
from apps.accounts.permissions import IsAdmin
from .models import SupportPlan, SupportSession
from .serializers import SupportPlanSerializer, SupportSessionSerializer


class SupportPlanViewSet(ModelViewSet):
    serializer_class = SupportPlanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = user.role_name
        qs = SupportPlan.objects.select_related("student", "assistant").prefetch_related("sessions")

        if role == "admin":
            pass
        elif role == "student":
            qs = qs.filter(student=user)
        elif role == "assistant":
            qs = qs.filter(assistant=user)
        else:
            qs = qs.none()

        student_id = self.request.query_params.get("student_id")
        if student_id:
            qs = qs.filter(student_id=student_id)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role_name == "student":
            serializer.save(student=user, status="pending")
        else:
            serializer.save()

    def get_permissions(self):
        if self.action in ("destroy", "confirm", "reject", "complete", "assign_assistant"):
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdmin])
    def confirm(self, request, pk=None):
        plan = self.get_object()
        if plan.status != "pending":
            return Response({"detail": "Može se potvrditi samo plan u statusu 'na čekanju'."}, status=status.HTTP_400_BAD_REQUEST)
        plan.status = "active"
        plan.save()
        return Response(SupportPlanSerializer(plan).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdmin])
    def reject(self, request, pk=None):
        plan = self.get_object()
        if plan.status != "pending":
            return Response({"detail": "Može se odbiti samo plan u statusu 'na čekanju'."}, status=status.HTTP_400_BAD_REQUEST)
        plan.status = "cancelled"
        plan.save()
        return Response(SupportPlanSerializer(plan).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdmin])
    def complete(self, request, pk=None):
        plan = self.get_object()
        if plan.status != "active":
            return Response({"detail": "Može se završiti samo aktivan plan."}, status=status.HTTP_400_BAD_REQUEST)
        plan.status = "completed"
        plan.save()
        return Response(SupportPlanSerializer(plan).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdmin])
    def assign_assistant(self, request, pk=None):
        plan = self.get_object()
        assistant_id = request.data.get("assistant_id")
        if not assistant_id:
            return Response({"detail": "assistant_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            assistant = CustomUser.objects.get(user_id=assistant_id, role__role_name="assistant")
        except CustomUser.DoesNotExist:
            return Response({"detail": "Asistent nije pronađen."}, status=status.HTTP_404_NOT_FOUND)
        plan.assistant = assistant
        if plan.status == "pending":
            plan.status = "active"
        plan.save()
        return Response(SupportPlanSerializer(plan).data)


class SupportSessionViewSet(ModelViewSet):
    serializer_class = SupportSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = user.role_name
        qs = SupportSession.objects.select_related("plan", "logged_by")

        if role == "admin":
            pass
        elif role == "assistant":
            qs = qs.filter(plan__assistant=user)
        elif role == "student":
            qs = qs.filter(plan__student=user)
        else:
            qs = qs.none()

        plan_id = self.request.query_params.get("plan_id")
        if plan_id:
            qs = qs.filter(plan_id=plan_id)

        return qs

    def perform_create(self, serializer):
        from django.db.models import Sum
        from rest_framework.exceptions import ValidationError
        plan = serializer.validated_data.get("plan")
        new_hours = serializer.validated_data.get("hours", 0)
        if plan:
            done = plan.sessions.aggregate(total=Sum("hours"))["total"] or 0
            if float(done) + float(new_hours) > float(plan.total_hours_planned):
                remaining = float(plan.total_hours_planned) - float(done)
                raise ValidationError({
                    "hours": (
                        f"Prekoračenje planiranog vremena. "
                        f"Preostalo: {remaining:.2f}h, pokušavate dodati: {float(new_hours):.2f}h."
                    )
                })
        serializer.save(logged_by=self.request.user)

    def get_permissions(self):
        if self.action == "destroy":
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]
