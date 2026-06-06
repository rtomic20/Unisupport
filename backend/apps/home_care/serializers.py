from rest_framework import serializers
from apps.accounts.models import CustomUser
from .models import HomeAppointment


class HomeAppointmentSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    caregiver_name = serializers.SerializerMethodField()
    caregiver = serializers.PrimaryKeyRelatedField(
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
            "caregiver_name",
            "appointment_date",
            "start_time",
            "end_time",
            "location",
            "description",
            "status",
            "created_at",
        ]
        read_only_fields = ["appointment_id", "created_at"]
        extra_kwargs = {"student": {"required": False}}

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"

    def get_caregiver_name(self, obj):
        if obj.caregiver:
            return f"{obj.caregiver.first_name} {obj.caregiver.last_name}"
        return None
