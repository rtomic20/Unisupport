import csv
from django.db.models import Count, Sum
from django.http import HttpResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdmin
from .models import Request


def _apply_filters(qs, params, date_field="request_date"):
    date_from = params.get("from")
    date_to = params.get("to")
    student_id = params.get("student_id")
    assigned_id = params.get("assigned_id")
    if date_from:
        qs = qs.filter(**{f"{date_field}__gte": date_from})
    if date_to:
        qs = qs.filter(**{f"{date_field}__lte": date_to})
    if student_id:
        qs = qs.filter(student_id=student_id)
    if assigned_id:
        qs = qs.filter(accepted_by_id=assigned_id)
    return qs


class RidesPerUserView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        qs = _apply_filters(
            Request.objects.filter(request_type="transport"),
            request.query_params,
        )
        data = (
            qs.values("student__user_id", "student__first_name", "student__last_name")
            .annotate(count=Count("request_id"))
            .order_by("-count")
        )
        result = [
            {
                "user_id": r["student__user_id"],
                "full_name": f"{r['student__first_name']} {r['student__last_name']}",
                "count": r["count"],
            }
            for r in data
        ]
        return Response(result)


class RidesPerDriverView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        qs = _apply_filters(
            Request.objects.filter(request_type="transport", accepted_by__isnull=False),
            request.query_params,
        )
        data = (
            qs.values(
                "accepted_by__user_id",
                "accepted_by__first_name",
                "accepted_by__last_name",
            )
            .annotate(count=Count("request_id"))
            .order_by("-count")
        )
        result = [
            {
                "user_id": r["accepted_by__user_id"],
                "full_name": f"{r['accepted_by__first_name']} {r['accepted_by__last_name']}",
                "count": r["count"],
            }
            for r in data
        ]
        return Response(result)


class UnifiedReportView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from apps.home_care.models import HomeAppointment
        from apps.peer_support.models import SupportSession

        params = request.query_params
        date_from = params.get("from")
        date_to = params.get("to")
        student_id = params.get("student_id")

        rides_qs = Request.objects.filter(request_type="transport")
        care_qs = HomeAppointment.objects.filter(status="completed")
        sessions_qs = SupportSession.objects.all()

        if date_from:
            rides_qs = rides_qs.filter(request_date__gte=date_from)
            care_qs = care_qs.filter(appointment_date__gte=date_from)
            sessions_qs = sessions_qs.filter(session_date__gte=date_from)
        if date_to:
            rides_qs = rides_qs.filter(request_date__lte=date_to)
            care_qs = care_qs.filter(appointment_date__lte=date_to)
            sessions_qs = sessions_qs.filter(session_date__lte=date_to)
        if student_id:
            rides_qs = rides_qs.filter(student_id=student_id)
            care_qs = care_qs.filter(student_id=student_id)
            sessions_qs = sessions_qs.filter(plan__student_id=student_id)

        return Response({
            "rides_count": rides_qs.count(),
            "care_appointments_count": care_qs.count(),
            "support_hours_total": float(
                sessions_qs.aggregate(total=Sum("hours"))["total"] or 0
            ),
        })


class ExportRidesCSVView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        qs = _apply_filters(
            Request.objects.filter(request_type="transport").select_related(
                "student", "accepted_by", "transport_details"
            ),
            request.query_params,
        )
        response = HttpResponse(content_type="text/csv; charset=utf-8-sig")
        response["Content-Disposition"] = 'attachment; filename="voznje.csv"'
        writer = csv.writer(response, delimiter=";")
        writer.writerow(["ID", "Datum", "Student", "Vozač", "Polazište", "Odredište", "Status"])
        for r in qs:
            td = getattr(r, "transport_details", None)
            writer.writerow([
                r.request_id,
                r.request_date,
                f"{r.student.first_name} {r.student.last_name}",
                f"{r.accepted_by.first_name} {r.accepted_by.last_name}" if r.accepted_by else "",
                td.pickup_address if td else "",
                td.dropoff_address if td else "",
                r.status,
            ])
        return response
