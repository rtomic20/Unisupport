# Unisupport — Novi moduli + Render deploy

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Dodati module njege u domu, vršnjačke podrške, anketa, poboljšati izvještaje i pristupačnost, te deployati na Render.com.

**Architecture:** Svaki novi modul je zasebna Django app (home_care, peer_support, surveys). Frontend dobiva nove stranice po ulogama. Render.yaml orkestrira backend (Gunicorn) + frontend (Static Site) + PostgreSQL.

**Tech Stack:** Django 5.1 + DRF + simplejwt, React 19 + TypeScript + Tailwind v4, PostgreSQL 16, Render.com, whitenoise, gunicorn

---

## Mapa fajlova

### Backend — novi fajlovi
- `backend/apps/home_care/__init__.py`
- `backend/apps/home_care/apps.py`
- `backend/apps/home_care/models.py` — HomeAppointment
- `backend/apps/home_care/serializers.py`
- `backend/apps/home_care/views.py`
- `backend/apps/home_care/urls.py`
- `backend/apps/home_care/admin.py`
- `backend/apps/peer_support/__init__.py`
- `backend/apps/peer_support/apps.py`
- `backend/apps/peer_support/models.py` — SupportPlan, SupportSession
- `backend/apps/peer_support/serializers.py`
- `backend/apps/peer_support/views.py`
- `backend/apps/peer_support/urls.py`
- `backend/apps/peer_support/admin.py`
- `backend/apps/surveys/__init__.py`
- `backend/apps/surveys/apps.py`
- `backend/apps/surveys/models.py` — Survey, SurveyQuestion, SurveyResponse, SurveyAnswer
- `backend/apps/surveys/serializers.py`
- `backend/apps/surveys/views.py`
- `backend/apps/surveys/urls.py`
- `backend/apps/surveys/admin.py`
- `backend/config/settings/production.py`
- `backend/render_build.sh` (build script za Render)

### Backend — izmjene
- `backend/apps/accounts/management/commands/seed_initial_data.py` — dodati uloge caregiver/assistant + demo korisnike
- `backend/apps/requests_app/reports.py` — proširiti filtriranje + CSV export
- `backend/apps/requests_app/urls.py` — dodati reports/export endpoint
- `backend/config/settings/base.py` — dodati nove apps
- `backend/config/urls.py` — dodati URL prefikse za nove apps
- `backend/requirements.txt` — dodati gunicorn, whitenoise

### Frontend — novi fajlovi
- `frontend/src/pages/admin/HomeCareAdminPage.tsx`
- `frontend/src/pages/admin/PeerSupportAdminPage.tsx`
- `frontend/src/pages/admin/SurveysAdminPage.tsx`
- `frontend/src/pages/caregiver/CaregiverDashboard.tsx`
- `frontend/src/pages/caregiver/CaregiverSchedulePage.tsx`
- `frontend/src/pages/assistant/AssistantDashboard.tsx`
- `frontend/src/pages/assistant/MyPlansPage.tsx`
- `frontend/src/pages/student/MyAppointmentsPage.tsx`
- `frontend/src/pages/student/MySupportPlansPage.tsx`
- `frontend/src/pages/student/SurveysPage.tsx`

### Frontend — izmjene
- `frontend/src/App.tsx` — dodati routes za caregiver, assistant, nove admin/student stranice
- `frontend/src/components/Navbar.tsx` — dodati linkove za nove uloge
- `frontend/src/contexts/AuthContext.tsx` — dodati caregiver/assistant u tip
- `frontend/src/pages/admin/ReportsPage.tsx` — filtri + export
- `frontend/src/styles/index.css` — pristupačnost

### Render config
- `render.yaml` (root level)

---

## Task 1: Seed — nove uloge i demo korisnici

**Files:**
- Modify: `backend/apps/accounts/management/commands/seed_initial_data.py`

- [ ] Proširiti seed da kreira uloge caregiver, assistant i demo korisnike za svaku ulogu:

```python
from django.core.management.base import BaseCommand
from apps.accounts.models import Role, CustomUser


class Command(BaseCommand):
    help = "Seeds initial roles and users"

    def handle(self, *args, **options):
        for name in ("admin", "student", "driver", "caregiver", "assistant"):
            Role.objects.get_or_create(role_name=name)
        self.stdout.write("Roles: OK")

        admin_role = Role.objects.get(role_name="admin")
        student_role = Role.objects.get(role_name="student")
        driver_role = Role.objects.get(role_name="driver")
        caregiver_role = Role.objects.get(role_name="caregiver")
        assistant_role = Role.objects.get(role_name="assistant")

        users = [
            ("admin@unisupport.local", "admin123", "Admin", "Unisupport", admin_role),
            ("student@unisupport.local", "student123", "Ana", "Horvat", student_role),
            ("driver@unisupport.local", "driver123", "Marko", "Kovač", driver_role),
            ("caregiver@unisupport.local", "caregiver123", "Ivana", "Perić", caregiver_role),
            ("assistant@unisupport.local", "assistant123", "Luka", "Matić", assistant_role),
        ]

        for email, password, first, last, role in users:
            if not CustomUser.objects.filter(email=email).exists():
                CustomUser.objects.create_user(
                    email=email,
                    password=password,
                    first_name=first,
                    last_name=last,
                    role=role,
                )
                self.stdout.write(f"Created: {email} / {password}")
            else:
                self.stdout.write(f"Exists: {email}")
```

- [ ] Pokrenuti seed lokalno:
```bash
docker exec unisupport-backend-1 python manage.py seed_initial_data
```

- [ ] Commit:
```bash
git add backend/apps/accounts/management/commands/seed_initial_data.py
git commit -m "feat: add caregiver/assistant roles and demo users to seed"
```

---

## Task 2: Home Care backend

**Files:**
- Create: `backend/apps/home_care/__init__.py`
- Create: `backend/apps/home_care/apps.py`
- Create: `backend/apps/home_care/models.py`
- Create: `backend/apps/home_care/serializers.py`
- Create: `backend/apps/home_care/views.py`
- Create: `backend/apps/home_care/urls.py`
- Create: `backend/apps/home_care/admin.py`
- Modify: `backend/config/settings/base.py`
- Modify: `backend/config/urls.py`

- [ ] Kreirati `backend/apps/home_care/__init__.py` (prazan)

- [ ] Kreirati `backend/apps/home_care/apps.py`:
```python
from django.apps import AppConfig

class HomeCareConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.home_care"
```

- [ ] Kreirati `backend/apps/home_care/models.py`:
```python
from django.db import models


class HomeAppointment(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("assigned", "Assigned"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    appointment_id = models.AutoField(primary_key=True)
    student = models.ForeignKey(
        "accounts.CustomUser",
        on_delete=models.CASCADE,
        related_name="home_appointments",
        limit_choices_to={"role__role_name": "student"},
    )
    caregiver = models.ForeignKey(
        "accounts.CustomUser",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="caregiver_appointments",
        limit_choices_to={"role__role_name": "caregiver"},
    )
    appointment_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    location = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "home_appointments"
        ordering = ["appointment_date", "start_time"]

    def __str__(self):
        return f"Termin #{self.appointment_id} - {self.student} ({self.appointment_date})"
```

- [ ] Kreirati `backend/apps/home_care/serializers.py`:
```python
from rest_framework import serializers
from apps.accounts.models import CustomUser
from .models import HomeAppointment


class HomeAppointmentSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    caregiver_name = serializers.SerializerMethodField()
    caregiver_id = serializers.PrimaryKeyRelatedField(
        source="caregiver",
        queryset=CustomUser.objects.filter(role__role_name="caregiver"),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = HomeAppointment
        fields = [
            "appointment_id",
            "student",
            "student_name",
            "caregiver",
            "caregiver_id",
            "caregiver_name",
            "appointment_date",
            "start_time",
            "end_time",
            "location",
            "description",
            "status",
            "created_at",
        ]
        read_only_fields = ["appointment_id", "created_at", "student_name", "caregiver_name"]
        extra_kwargs = {"student": {"required": False}}

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"

    def get_caregiver_name(self, obj):
        if obj.caregiver:
            return f"{obj.caregiver.first_name} {obj.caregiver.last_name}"
        return None
```

- [ ] Kreirati `backend/apps/home_care/views.py`:
```python
from django.utils.timezone import now
from rest_framework import generics, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.accounts.permissions import IsAdmin, IsCaregiver, IsStudent
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
        if self.action in ("destroy",):
            return [IsAuthenticated(), IsAdmin()]
        if self.action in ("create",):
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsAdmin])
    def assign_caregiver(self, request, pk=None):
        appt = self.get_object()
        caregiver_id = request.data.get("caregiver_id")
        if not caregiver_id:
            return Response({"detail": "caregiver_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        from apps.accounts.models import CustomUser
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
        appt.status = "completed"
        appt.save()
        return Response(HomeAppointmentSerializer(appt).data)
```

- [ ] Kreirati `backend/apps/home_care/urls.py`:
```python
from rest_framework.routers import DefaultRouter
from .views import HomeAppointmentViewSet

router = DefaultRouter()
router.register(r"appointments", HomeAppointmentViewSet, basename="home-appointment")

urlpatterns = router.urls
```

- [ ] Kreirati `backend/apps/home_care/admin.py`:
```python
from django.contrib import admin
from .models import HomeAppointment

admin.site.register(HomeAppointment)
```

- [ ] Dodati app u `backend/config/settings/base.py` — LOCAL_APPS:
```python
LOCAL_APPS = [
    "apps.accounts",
    "apps.requests_app",
    "apps.home_care",
    "apps.peer_support",
    "apps.surveys",
]
```

- [ ] Dodati URL u `backend/config/urls.py`:
```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/accounts/", include("apps.accounts.urls_management")),
    path("api/requests/", include("apps.requests_app.urls")),
    path("api/home-care/", include("apps.home_care.urls")),
    path("api/peer-support/", include("apps.peer_support.urls")),
    path("api/surveys/", include("apps.surveys.urls")),
]
```

- [ ] Dodati IsCaregiver/IsAssistant u `backend/apps/accounts/permissions.py`:
```python
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role_name == "admin"


class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role_name == "student"


class IsDriver(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role_name == "driver"


class IsAdminOrDriver(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role_name in ("admin", "driver")


class IsCaregiver(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role_name == "caregiver"


class IsAssistant(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role_name == "assistant"
```

- [ ] Pokrenuti migracije:
```bash
docker exec unisupport-backend-1 python manage.py makemigrations home_care
docker exec unisupport-backend-1 python manage.py migrate
```

- [ ] Commit:
```bash
git add backend/apps/home_care/ backend/apps/accounts/permissions.py backend/config/settings/base.py backend/config/urls.py
git commit -m "feat: home_care backend — HomeAppointment model, API, assign caregiver"
```

---

## Task 3: Peer Support backend

**Files:**
- Create: `backend/apps/peer_support/` (sve)
- Modify: (već dodano u Task 2 — settings/urls)

- [ ] Kreirati `backend/apps/peer_support/__init__.py` (prazan)

- [ ] Kreirati `backend/apps/peer_support/apps.py`:
```python
from django.apps import AppConfig

class PeerSupportConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.peer_support"
```

- [ ] Kreirati `backend/apps/peer_support/models.py`:
```python
from django.db import models


class SupportPlan(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    plan_id = models.AutoField(primary_key=True)
    student = models.ForeignKey(
        "accounts.CustomUser",
        on_delete=models.CASCADE,
        related_name="support_plans",
        limit_choices_to={"role__role_name": "student"},
    )
    assistant = models.ForeignKey(
        "accounts.CustomUser",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_plans",
        limit_choices_to={"role__role_name": "assistant"},
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    total_hours_planned = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "support_plans"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Plan #{self.plan_id}: {self.title} ({self.student})"


class SupportSession(models.Model):
    session_id = models.AutoField(primary_key=True)
    plan = models.ForeignKey(SupportPlan, on_delete=models.CASCADE, related_name="sessions")
    session_date = models.DateField()
    hours = models.DecimalField(max_digits=4, decimal_places=2)
    notes = models.TextField(blank=True)
    logged_by = models.ForeignKey(
        "accounts.CustomUser",
        on_delete=models.SET_NULL,
        null=True,
        related_name="logged_sessions",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "support_sessions"
        ordering = ["-session_date"]

    def __str__(self):
        return f"Sesija #{self.session_id} — Plan #{self.plan_id} ({self.hours}h)"
```

- [ ] Kreirati `backend/apps/peer_support/serializers.py`:
```python
from rest_framework import serializers
from apps.accounts.models import CustomUser
from .models import SupportPlan, SupportSession


class SupportSessionSerializer(serializers.ModelSerializer):
    logged_by_name = serializers.SerializerMethodField()

    class Meta:
        model = SupportSession
        fields = ["session_id", "plan", "session_date", "hours", "notes", "logged_by", "logged_by_name", "created_at"]
        read_only_fields = ["session_id", "logged_by", "created_at"]

    def get_logged_by_name(self, obj):
        if obj.logged_by:
            return f"{obj.logged_by.first_name} {obj.logged_by.last_name}"
        return None


class SupportPlanSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    assistant_name = serializers.SerializerMethodField()
    sessions = SupportSessionSerializer(many=True, read_only=True)
    total_hours_done = serializers.SerializerMethodField()
    assistant_id = serializers.PrimaryKeyRelatedField(
        source="assistant",
        queryset=CustomUser.objects.filter(role__role_name="assistant"),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = SupportPlan
        fields = [
            "plan_id", "student", "student_name", "assistant", "assistant_id",
            "assistant_name", "title", "description", "start_date", "end_date",
            "total_hours_planned", "status", "created_at", "sessions", "total_hours_done",
        ]
        read_only_fields = ["plan_id", "created_at"]
        extra_kwargs = {"student": {"required": False}}

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"

    def get_assistant_name(self, obj):
        if obj.assistant:
            return f"{obj.assistant.first_name} {obj.assistant.last_name}"
        return None

    def get_total_hours_done(self, obj):
        return float(sum(s.hours for s in obj.sessions.all()))
```

- [ ] Kreirati `backend/apps/peer_support/views.py`:
```python
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

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
            serializer.save(student=user)
        else:
            serializer.save()

    def get_permissions(self):
        if self.action in ("destroy",):
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]


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
        serializer.save(logged_by=self.request.user)
```

- [ ] Kreirati `backend/apps/peer_support/urls.py`:
```python
from rest_framework.routers import DefaultRouter
from .views import SupportPlanViewSet, SupportSessionViewSet

router = DefaultRouter()
router.register(r"plans", SupportPlanViewSet, basename="support-plan")
router.register(r"sessions", SupportSessionViewSet, basename="support-session")

urlpatterns = router.urls
```

- [ ] Kreirati `backend/apps/peer_support/admin.py`:
```python
from django.contrib import admin
from .models import SupportPlan, SupportSession

admin.site.register(SupportPlan)
admin.site.register(SupportSession)
```

- [ ] Pokrenuti migracije:
```bash
docker exec unisupport-backend-1 python manage.py makemigrations peer_support
docker exec unisupport-backend-1 python manage.py migrate
```

- [ ] Commit:
```bash
git add backend/apps/peer_support/
git commit -m "feat: peer_support backend — SupportPlan, SupportSession, API"
```

---

## Task 4: Surveys backend

**Files:**
- Create: `backend/apps/surveys/` (sve)

- [ ] Kreirati `backend/apps/surveys/__init__.py` (prazan)

- [ ] Kreirati `backend/apps/surveys/apps.py`:
```python
from django.apps import AppConfig

class SurveysConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.surveys"
```

- [ ] Kreirati `backend/apps/surveys/models.py`:
```python
from django.db import models


class Survey(models.Model):
    survey_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        "accounts.CustomUser", on_delete=models.SET_NULL, null=True, related_name="created_surveys"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "surveys"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class SurveyQuestion(models.Model):
    question_id = models.AutoField(primary_key=True)
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name="questions")
    text = models.TextField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "survey_questions"
        ordering = ["order"]

    def __str__(self):
        return f"Q{self.order}: {self.text[:50]}"


class SurveyResponse(models.Model):
    response_id = models.AutoField(primary_key=True)
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name="responses")
    student = models.ForeignKey(
        "accounts.CustomUser", on_delete=models.CASCADE, related_name="survey_responses"
    )
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "survey_responses"
        unique_together = [("survey", "student")]

    def __str__(self):
        return f"Odgovor: {self.student} na '{self.survey}'"


class SurveyAnswer(models.Model):
    answer_id = models.AutoField(primary_key=True)
    response = models.ForeignKey(SurveyResponse, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(SurveyQuestion, on_delete=models.CASCADE)
    answer_text = models.TextField()

    class Meta:
        db_table = "survey_answers"
```

- [ ] Kreirati `backend/apps/surveys/serializers.py`:
```python
from rest_framework import serializers
from .models import Survey, SurveyQuestion, SurveyResponse, SurveyAnswer


class SurveyQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyQuestion
        fields = ["question_id", "text", "order"]


class SurveyAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyAnswer
        fields = ["question", "answer_text"]


class SurveyResponseSerializer(serializers.ModelSerializer):
    answers = SurveyAnswerSerializer(many=True)
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = SurveyResponse
        fields = ["response_id", "survey", "student", "student_name", "submitted_at", "answers"]
        read_only_fields = ["response_id", "student", "submitted_at"]

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"

    def create(self, validated_data):
        answers_data = validated_data.pop("answers")
        response = SurveyResponse.objects.create(**validated_data)
        for answer_data in answers_data:
            SurveyAnswer.objects.create(response=response, **answer_data)
        return response


class SurveySerializer(serializers.ModelSerializer):
    questions = SurveyQuestionSerializer(many=True, required=False)
    response_count = serializers.SerializerMethodField()

    class Meta:
        model = Survey
        fields = ["survey_id", "title", "description", "created_by", "created_at", "is_active", "questions", "response_count"]
        read_only_fields = ["survey_id", "created_by", "created_at"]

    def get_response_count(self, obj):
        return obj.responses.count()

    def create(self, validated_data):
        questions_data = validated_data.pop("questions", [])
        survey = Survey.objects.create(**validated_data)
        for i, q in enumerate(questions_data):
            SurveyQuestion.objects.create(survey=survey, order=i, **q)
        return survey
```

- [ ] Kreirati `backend/apps/surveys/views.py`:
```python
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from rest_framework.decorators import action

from apps.accounts.permissions import IsAdmin
from .models import Survey, SurveyResponse
from .serializers import SurveySerializer, SurveyResponseSerializer


class SurveyViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return SurveySerializer

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
        serializer.save(student=self.request.user)

    def get_permissions(self):
        if self.action == "destroy":
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]
```

- [ ] Kreirati `backend/apps/surveys/urls.py`:
```python
from rest_framework.routers import DefaultRouter
from .views import SurveyViewSet, SurveyResponseViewSet

router = DefaultRouter()
router.register(r"", SurveyViewSet, basename="survey")
router.register(r"responses", SurveyResponseViewSet, basename="survey-response")

urlpatterns = router.urls
```

- [ ] Kreirati `backend/apps/surveys/admin.py`:
```python
from django.contrib import admin
from .models import Survey, SurveyQuestion, SurveyResponse, SurveyAnswer

admin.site.register(Survey)
admin.site.register(SurveyQuestion)
admin.site.register(SurveyResponse)
admin.site.register(SurveyAnswer)
```

- [ ] Pokrenuti migracije:
```bash
docker exec unisupport-backend-1 python manage.py makemigrations surveys
docker exec unisupport-backend-1 python manage.py migrate
```

- [ ] Commit:
```bash
git add backend/apps/surveys/
git commit -m "feat: surveys backend — Survey, Questions, Responses, API"
```

---

## Task 5: Prošireni izvještaji + CSV export (backend)

**Files:**
- Modify: `backend/apps/requests_app/reports.py`
- Modify: `backend/apps/requests_app/urls.py`

- [ ] Zamijeniti `backend/apps/requests_app/reports.py`:
```python
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


def _filter_qs(qs, params, date_field="request_date"):
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
        qs = _filter_qs(Request.objects.filter(request_type="transport"), request.query_params)
        data = (
            qs.values("student__user_id", "student__first_name", "student__last_name")
            .annotate(count=Count("request_id"))
            .order_by("-count")
        )
        result = [
            {"user_id": r["student__user_id"], "full_name": f"{r['student__first_name']} {r['student__last_name']}", "count": r["count"]}
            for r in data
        ]
        return Response(result)


class RidesPerDriverView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        qs = _filter_qs(
            Request.objects.filter(request_type="transport", accepted_by__isnull=False),
            request.query_params,
        )
        data = (
            qs.values("accepted_by__user_id", "accepted_by__first_name", "accepted_by__last_name")
            .annotate(count=Count("request_id"))
            .order_by("-count")
        )
        result = [
            {"user_id": r["accepted_by__user_id"], "full_name": f"{r['accepted_by__first_name']} {r['accepted_by__last_name']}", "count": r["count"]}
            for r in data
        ]
        return Response(result)


class UnifiedReportView(APIView):
    """Objedinjeni izvještaj: vožnje + njega + sati podrške"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        params = request.query_params
        date_from = params.get("from")
        date_to = params.get("to")
        student_id = params.get("student_id")

        rides_qs = Request.objects.filter(request_type="transport", status="completed")
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
            "support_hours_total": float(sessions_qs.aggregate(total=Sum("hours"))["total"] or 0),
        })


class ExportRidesCSVView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        qs = _filter_qs(
            Request.objects.filter(request_type="transport").select_related("student", "accepted_by", "transport_details"),
            request.query_params,
        )
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="vožnje.csv"'
        response.write("﻿")  # BOM za Excel
        writer = csv.writer(response)
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
```

- [ ] Ažurirati `backend/apps/requests_app/urls.py` dodajući nove endpoints:
```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RequestViewSet
from .reports import RidesPerUserView, RidesPerDriverView, UnifiedReportView, ExportRidesCSVView

router = DefaultRouter()
router.register(r"", RequestViewSet, basename="request")

urlpatterns = [
    path("reports/rides-per-user/", RidesPerUserView.as_view()),
    path("reports/rides-per-driver/", RidesPerDriverView.as_view()),
    path("reports/unified/", UnifiedReportView.as_view()),
    path("reports/export-rides-csv/", ExportRidesCSVView.as_view()),
    path("", include(router.urls)),
]
```

- [ ] Commit:
```bash
git add backend/apps/requests_app/reports.py backend/apps/requests_app/urls.py
git commit -m "feat: unified reports, CSV export, extended filters"
```

---

## Task 6: Production settings + requirements + Render config

**Files:**
- Create: `backend/config/settings/production.py`
- Create: `render.yaml`
- Modify: `backend/requirements.txt`

- [ ] Dodati gunicorn i whitenoise u `backend/requirements.txt`:
```
Django==5.1
djangorestframework==3.15.2
djangorestframework-simplejwt==5.3.1
django-cors-headers==4.4.0
dj-database-url==2.2.0
psycopg2-binary==2.9.9
gunicorn==22.0.0
whitenoise==6.7.0
```

- [ ] Kreirati `backend/config/settings/production.py`:
```python
from .base import *
import os

DEBUG = False

ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "*").split(",")

MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:4200",
).split(",")

CORS_ALLOW_ALL_ORIGINS = False
```

- [ ] Kreirati `render.yaml` u root direktoriju projekta:
```yaml
services:
  - type: web
    name: unisupport-backend
    runtime: python
    rootDir: backend
    buildCommand: >
      pip install -r requirements.txt &&
      python manage.py collectstatic --no-input &&
      python manage.py migrate &&
      python manage.py seed_initial_data
    startCommand: gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2
    envVars:
      - key: DJANGO_SETTINGS_MODULE
        value: config.settings.production
      - key: DATABASE_URL
        fromDatabase:
          name: unisupport-db
          property: connectionString
      - key: DJANGO_SECRET_KEY
        generateValue: true
      - key: DEBUG
        value: "False"
      - key: CORS_ALLOWED_ORIGINS
        value: https://unisupport-frontend.onrender.com
      - key: PYTHON_VERSION
        value: "3.11.0"

  - type: web
    name: unisupport-frontend
    runtime: static
    rootDir: frontend
    buildCommand: npm install && npm run build
    staticPublishPath: dist
    envVars:
      - key: VITE_API_URL
        value: https://unisupport-backend.onrender.com/api
    routes:
      - type: rewrite
        source: /*
        destination: /index.html

databases:
  - name: unisupport-db
    databaseName: unisupport
    user: unisupport
    plan: free
```

- [ ] Commit:
```bash
git add render.yaml backend/config/settings/production.py backend/requirements.txt
git commit -m "feat: production settings, render.yaml, gunicorn/whitenoise"
```

---

## Task 7: Frontend — novi routes i Navbar

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/Navbar.tsx`
- Modify: `frontend/src/contexts/AuthContext.tsx`

- [ ] Ažurirati `frontend/src/contexts/AuthContext.tsx` — dodati caregiver/assistant u tip:

Pronađi `type User` ili `role` tip i dodaj:
```typescript
// U tipu koji definira role, dodaj:
role: "admin" | "student" | "driver" | "caregiver" | "assistant";
```

- [ ] Ažurirati RoleRedirect u `frontend/src/App.tsx` — dodati nove uloge i importati nove stranice:
```typescript
import CaregiverDashboard from "./pages/caregiver/CaregiverDashboard";
import CaregiverSchedulePage from "./pages/caregiver/CaregiverSchedulePage";
import AssistantDashboard from "./pages/assistant/AssistantDashboard";
import MyPlansPage from "./pages/assistant/MyPlansPage";
import MyAppointmentsPage from "./pages/student/MyAppointmentsPage";
import MySupportPlansPage from "./pages/student/MySupportPlansPage";
import SurveysPage from "./pages/student/SurveysPage";
import HomeCareAdminPage from "./pages/admin/HomeCareAdminPage";
import PeerSupportAdminPage from "./pages/admin/PeerSupportAdminPage";
import SurveysAdminPage from "./pages/admin/SurveysAdminPage";
```

U RoleRedirect dodati:
```typescript
if (user.role === "caregiver") return <Navigate to="/caregiver/dashboard" replace />;
if (user.role === "assistant") return <Navigate to="/assistant/dashboard" replace />;
```

Dodati routes:
```tsx
{/* Admin — novi moduli */}
<Route path="/admin/home-care" element={
  <PrivateRoute role="admin"><Layout><HomeCareAdminPage /></Layout></PrivateRoute>
} />
<Route path="/admin/peer-support" element={
  <PrivateRoute role="admin"><Layout><PeerSupportAdminPage /></Layout></PrivateRoute>
} />
<Route path="/admin/surveys" element={
  <PrivateRoute role="admin"><Layout><SurveysAdminPage /></Layout></PrivateRoute>
} />

{/* Student — novi */}
<Route path="/student/appointments" element={
  <PrivateRoute role="student"><Layout><MyAppointmentsPage /></Layout></PrivateRoute>
} />
<Route path="/student/support-plans" element={
  <PrivateRoute role="student"><Layout><MySupportPlansPage /></Layout></PrivateRoute>
} />
<Route path="/student/surveys" element={
  <PrivateRoute role="student"><Layout><SurveysPage /></Layout></PrivateRoute>
} />

{/* Caregiver */}
<Route path="/caregiver/dashboard" element={
  <PrivateRoute role="caregiver"><Layout><CaregiverDashboard /></Layout></PrivateRoute>
} />
<Route path="/caregiver/schedule" element={
  <PrivateRoute role="caregiver"><Layout><CaregiverSchedulePage /></Layout></PrivateRoute>
} />

{/* Assistant */}
<Route path="/assistant/dashboard" element={
  <PrivateRoute role="assistant"><Layout><AssistantDashboard /></Layout></PrivateRoute>
} />
<Route path="/assistant/plans" element={
  <PrivateRoute role="assistant"><Layout><MyPlansPage /></Layout></PrivateRoute>
} />
```

- [ ] Commit:
```bash
git add frontend/src/App.tsx frontend/src/contexts/AuthContext.tsx
git commit -m "feat: add caregiver/assistant routes and role redirects"
```

---

## Task 8-14: Frontend stranice (sve se implementiraju kao zasebni commiti)

Svaka stranica koristi isti pattern:
- `api` pozivi kroz `src/api/axios.ts` s JWT interceptorom
- Tailwind klase s pristupačnim kontrastom (text-gray-900, bg-white, focus:ring-2)
- ARIA atributi na interaktivnim elementima

Stranice koje treba kreirati (detaljni kod u pojedinim taskovima implementacije):
- `HomeCareAdminPage.tsx` — lista termina, forma za novi termin, dodjela caregiver
- `PeerSupportAdminPage.tsx` — lista planova, forma za novi plan, dodjela assistant
- `SurveysAdminPage.tsx` — lista anketa, forma za novu anketu, prikaz odgovora
- `CaregiverDashboard.tsx` — sumarni prikaz termina danas
- `CaregiverSchedulePage.tsx` — dnevni raspored s filtriranjem po datumu
- `AssistantDashboard.tsx` — sumarni prikaz planova
- `MyPlansPage.tsx` — lista planova s mogućnošću evidentiranja sati
- `MyAppointmentsPage.tsx` — student vidi svoje termine njege
- `MySupportPlansPage.tsx` — student vidi svoje planove podrške
- `SurveysPage.tsx` — student popunjava aktivne ankete

---

## Demo login podaci (za Render)

| Email | Lozinka | Uloga |
|-------|---------|-------|
| admin@unisupport.local | admin123 | Admin |
| student@unisupport.local | student123 | Student |
| driver@unisupport.local | driver123 | Vozač |
| caregiver@unisupport.local | caregiver123 | Pružatelj njege |
| assistant@unisupport.local | assistant123 | Asistent |
