from rest_framework import serializers
from apps.accounts.models import CustomUser
from .models import SupportPlan, SupportSession


class SupportSessionSerializer(serializers.ModelSerializer):
    logged_by_name = serializers.SerializerMethodField()

    class Meta:
        model = SupportSession
        fields = [
            "session_id", "plan", "session_date", "hours",
            "notes", "logged_by", "logged_by_name", "created_at",
        ]
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
    assistant = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.filter(role__role_name="assistant"),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = SupportPlan
        fields = [
            "plan_id", "student", "student_name", "assistant",
            "assistant_name", "title", "description", "start_date",
            "end_date", "total_hours_planned", "status", "created_at",
            "sessions", "total_hours_done",
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
