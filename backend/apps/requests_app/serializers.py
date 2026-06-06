from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from .models import Request, TransportDetails, ServiceDetails


class TransportDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransportDetails
        fields = ["pickup_address", "dropoff_address"]


class ServiceDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceDetails
        fields = ["service_category", "location"]


class RequestSerializer(serializers.ModelSerializer):
    transport_details = TransportDetailsSerializer(required=False, allow_null=True)
    service_details = ServiceDetailsSerializer(required=False, allow_null=True)
    student_name = serializers.SerializerMethodField()
    accepted_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Request
        fields = [
            "request_id",
            "student",
            "student_name",
            "request_type",
            "request_date",
            "start_time",
            "end_time",
            "status",
            "description",
            "accepted_by",
            "accepted_by_name",
            "created_at",
            "accepted_at",
            "transport_details",
            "service_details",
        ]
        read_only_fields = ["request_id", "status", "accepted_by", "accepted_at", "created_at"]
        extra_kwargs = {
            "student": {"required": False},
            "start_time": {"required": False, "allow_null": True},
        }

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"

    def get_accepted_by_name(self, obj):
        if obj.accepted_by:
            return f"{obj.accepted_by.first_name} {obj.accepted_by.last_name}"
        return None

    def validate(self, data):
        request_type = data.get("request_type", getattr(self.instance, "request_type", None))
        transport = data.get("transport_details")
        service = data.get("service_details")

        if request_type == "transport" and not transport:
            raise serializers.ValidationError(
                {"transport_details": "Required for transport requests."}
            )
        if request_type == "service" and not service:
            raise serializers.ValidationError(
                {"service_details": "Required for service requests."}
            )

        start = data.get("start_time")
        end = data.get("end_time")
        if start and end and end <= start:
            raise serializers.ValidationError(
                {"end_time": "Vrijeme dolaska mora biti nakon vremena polaska."}
            )
        return data

    @transaction.atomic
    def create(self, validated_data):
        transport_data = validated_data.pop("transport_details", None)
        service_data = validated_data.pop("service_details", None)

        request = Request.objects.create(**validated_data)

        if transport_data:
            TransportDetails.objects.create(request=request, **transport_data)
        if service_data:
            ServiceDetails.objects.create(request=request, **service_data)

        return request

    @transaction.atomic
    def update(self, instance, validated_data):
        transport_data = validated_data.pop("transport_details", None)
        service_data = validated_data.pop("service_details", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if transport_data is not None:
            TransportDetails.objects.update_or_create(
                request=instance, defaults=transport_data
            )
        if service_data is not None:
            ServiceDetails.objects.update_or_create(
                request=instance, defaults=service_data
            )

        return instance
