from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from apps.accounts.models import CustomUser
from apps.accounts.permissions import IsAdmin, IsDriver, IsStudent, IsAdminOrDriver
from .models import Request, TransportDetails, ServiceDetails
from .serializers import RequestSerializer


class RequestViewSet(ModelViewSet):
    serializer_class = RequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = user.role_name

        qs = Request.objects.select_related(
            "student", "accepted_by",
            "transport_details", "service_details"
        )

        if role == "admin":
            pass  # sees all
        elif role == "student":
            qs = qs.filter(student=user)
        elif role == "driver":
            qs = qs.filter(request_type="transport").filter(
                Q(status="pending") | Q(accepted_by=user)
            )
        else:
            qs = qs.none()

        # Filter by date
        date = self.request.query_params.get("date")
        if date:
            qs = qs.filter(request_date=date)

        # Filter by month (YYYY-MM)
        month = self.request.query_params.get("month")
        if month:
            try:
                year, m = month.split("-")
                qs = qs.filter(request_date__year=int(year), request_date__month=int(m))
            except (ValueError, AttributeError):
                pass

        req_type = self.request.query_params.get("type")
        if req_type:
            qs = qs.filter(request_type=req_type)

        req_status = self.request.query_params.get("status")
        if req_status:
            qs = qs.filter(status=req_status)

        student_id = self.request.query_params.get("student_id")
        if student_id:
            qs = qs.filter(student_id=student_id)

        return qs.distinct().order_by("-created_at")

    def perform_create(self, serializer):
        user = self.request.user
        if user.role_name == "student":
            serializer.save(student=user)
        else:
            serializer.save()

    def get_permissions(self):
        if self.action in ("destroy",):
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdminOrDriver])
    def accept(self, request, pk=None):
        req = self.get_object()
        if req.status != "pending":
            return Response(
                {"detail": "Only pending requests can be accepted."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if req.request_type != "transport":
            return Response(
                {"detail": "Drivers can only accept transport requests."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        pickup_time = request.data.get("pickup_time")
        if not pickup_time:
            return Response(
                {"detail": "pickup_time je obavezan."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        req.start_time = pickup_time
        req.status = "accepted"
        req.accepted_by = request.user
        req.accepted_at = timezone.now()
        req.save()
        return Response(RequestSerializer(req).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdminOrDriver])
    def reject(self, request, pk=None):
        req = self.get_object()
        if req.status not in ("pending", "accepted"):
            return Response(
                {"detail": "Cannot reject in current state."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        req.status = "rejected"
        req.save()
        return Response(RequestSerializer(req).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdminOrDriver])
    def complete(self, request, pk=None):
        req = self.get_object()
        if req.status != "accepted":
            return Response(
                {"detail": "Only accepted requests can be completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        req.status = "completed"
        req.save()
        return Response(RequestSerializer(req).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdmin])
    def assign_driver(self, request, pk=None):
        req = self.get_object()
        driver_id = request.data.get("driver_id")
        if not driver_id:
            return Response(
                {"detail": "driver_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            driver = CustomUser.objects.get(user_id=driver_id, role__role_name="driver")
        except CustomUser.DoesNotExist:
            return Response(
                {"detail": "Driver not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        req.accepted_by = driver
        req.accepted_at = timezone.now()
        req.status = "accepted"
        req.save()
        return Response(RequestSerializer(req).data)
