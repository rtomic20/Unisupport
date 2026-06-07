import csv
from django.db.models import Count, Sum
from django.http import HttpResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdmin
from apps.home_care.models import HomeAppointment
from apps.peer_support.models import SupportSession
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


class CareAppointmentsPerCaregiverView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        params = request.query_params
        qs = HomeAppointment.objects.filter(caregiver__isnull=False)
        if params.get("from"):
            qs = qs.filter(appointment_date__gte=params["from"])
        if params.get("to"):
            qs = qs.filter(appointment_date__lte=params["to"])
        if params.get("student_id"):
            qs = qs.filter(student_id=params["student_id"])
        data = (
            qs.values("caregiver__user_id", "caregiver__first_name", "caregiver__last_name")
            .annotate(count=Count("appointment_id"))
            .order_by("-count")
        )
        return Response([
            {
                "user_id": r["caregiver__user_id"],
                "full_name": f"{r['caregiver__first_name']} {r['caregiver__last_name']}",
                "count": r["count"],
            }
            for r in data
        ])


class SupportHoursPerAssistantView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        params = request.query_params
        qs = SupportSession.objects.filter(plan__assistant__isnull=False)
        if params.get("from"):
            qs = qs.filter(session_date__gte=params["from"])
        if params.get("to"):
            qs = qs.filter(session_date__lte=params["to"])
        if params.get("student_id"):
            qs = qs.filter(plan__student_id=params["student_id"])
        data = (
            qs.values("plan__assistant__user_id", "plan__assistant__first_name", "plan__assistant__last_name")
            .annotate(total=Sum("hours"))
            .order_by("-total")
        )
        return Response([
            {
                "user_id": r["plan__assistant__user_id"],
                "full_name": f"{r['plan__assistant__first_name']} {r['plan__assistant__last_name']}",
                "count": float(r["total"]),
            }
            for r in data
        ])


class TransportDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        params = request.query_params
        qs = Request.objects.filter(request_type="transport", status="completed")
        if params.get("from"):
            qs = qs.filter(request_date__gte=params["from"])
        if params.get("to"):
            qs = qs.filter(request_date__lte=params["to"])
        if params.get("student_id"):
            qs = qs.filter(student_id=params["student_id"])
        if params.get("worker_id"):
            qs = qs.filter(accepted_by_id=params["worker_id"])
        data = (
            qs.values(
                "student__user_id", "student__first_name", "student__last_name",
                "accepted_by__user_id", "accepted_by__first_name", "accepted_by__last_name",
            )
            .annotate(count=Count("request_id"))
            .order_by("student__last_name", "-count")
        )
        return Response([
            {
                "student_name": f"{r['student__first_name']} {r['student__last_name']}",
                "worker_name": f"{r['accepted_by__first_name']} {r['accepted_by__last_name']}",
                "count": r["count"],
                "unit": "vožnji",
            }
            for r in data
        ])


class CareDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        params = request.query_params
        qs = HomeAppointment.objects.filter(status="completed")
        if params.get("from"):
            qs = qs.filter(appointment_date__gte=params["from"])
        if params.get("to"):
            qs = qs.filter(appointment_date__lte=params["to"])
        if params.get("student_id"):
            qs = qs.filter(student_id=params["student_id"])
        if params.get("worker_id"):
            qs = qs.filter(caregiver_id=params["worker_id"])
        data = (
            qs.values(
                "student__user_id", "student__first_name", "student__last_name",
                "caregiver__user_id", "caregiver__first_name", "caregiver__last_name",
            )
            .annotate(count=Count("appointment_id"))
            .order_by("student__last_name", "-count")
        )
        return Response([
            {
                "student_name": f"{r['student__first_name']} {r['student__last_name']}",
                "worker_name": f"{r['caregiver__first_name']} {r['caregiver__last_name']}",
                "count": r["count"],
                "unit": "termina",
            }
            for r in data
        ])


class SupportDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        params = request.query_params
        qs = SupportSession.objects.filter(plan__status="completed")
        if params.get("from"):
            qs = qs.filter(session_date__gte=params["from"])
        if params.get("to"):
            qs = qs.filter(session_date__lte=params["to"])
        if params.get("student_id"):
            qs = qs.filter(plan__student_id=params["student_id"])
        if params.get("worker_id"):
            qs = qs.filter(plan__assistant_id=params["worker_id"])
        data = (
            qs.values(
                "plan__student__user_id", "plan__student__first_name", "plan__student__last_name",
                "plan__assistant__user_id", "plan__assistant__first_name", "plan__assistant__last_name",
            )
            .annotate(total=Sum("hours"))
            .order_by("plan__student__last_name", "-total")
        )
        return Response([
            {
                "student_name": f"{r['plan__student__first_name']} {r['plan__student__last_name']}",
                "worker_name": f"{r['plan__assistant__first_name']} {r['plan__assistant__last_name']}",
                "count": float(r["total"]),
                "unit": "sati",
            }
            for r in data
        ])


class UnifiedReportView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        params = request.query_params
        date_from = params.get("from")
        date_to = params.get("to")
        student_id = params.get("student_id")

        rides_qs = Request.objects.filter(request_type="transport")
        care_qs = HomeAppointment.objects.all()
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


class ExportCareCSVView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        params = request.query_params
        qs = HomeAppointment.objects.select_related("student", "caregiver")
        if params.get("from"):
            qs = qs.filter(appointment_date__gte=params["from"])
        if params.get("to"):
            qs = qs.filter(appointment_date__lte=params["to"])
        if params.get("student_id"):
            qs = qs.filter(student_id=params["student_id"])
        response = HttpResponse(content_type="text/csv; charset=utf-8-sig")
        response["Content-Disposition"] = 'attachment; filename="njega.csv"'
        writer = csv.writer(response, delimiter=";")
        writer.writerow(["ID", "Datum", "Početak", "Kraj", "Student", "Njegovatelj", "Lokacija", "Status"])
        for a in qs:
            writer.writerow([
                a.appointment_id, a.appointment_date,
                str(a.start_time)[:5], str(a.end_time)[:5],
                f"{a.student.first_name} {a.student.last_name}",
                f"{a.caregiver.first_name} {a.caregiver.last_name}" if a.caregiver else "",
                a.location, a.status,
            ])
        return response


class ExportSupportCSVView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        params = request.query_params
        qs = SupportSession.objects.select_related("plan__student", "plan__assistant")
        if params.get("from"):
            qs = qs.filter(session_date__gte=params["from"])
        if params.get("to"):
            qs = qs.filter(session_date__lte=params["to"])
        if params.get("student_id"):
            qs = qs.filter(plan__student_id=params["student_id"])
        response = HttpResponse(content_type="text/csv; charset=utf-8-sig")
        response["Content-Disposition"] = 'attachment; filename="podrska.csv"'
        writer = csv.writer(response, delimiter=";")
        writer.writerow(["Sesija ID", "Datum sesije", "Student", "Asistent", "Sati", "Bilješka"])
        for s in qs:
            plan = s.plan
            writer.writerow([
                s.session_id, s.session_date,
                f"{plan.student.first_name} {plan.student.last_name}",
                f"{plan.assistant.first_name} {plan.assistant.last_name}" if plan.assistant else "",
                float(s.hours), s.notes,
            ])
        return response
