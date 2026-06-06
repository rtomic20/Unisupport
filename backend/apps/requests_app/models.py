from django.db import models
from django.core.exceptions import ValidationError


class Request(models.Model):
    REQUEST_TYPE_CHOICES = [("transport", "Transport"), ("service", "Service")]
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
        ("completed", "Completed"),
    ]

    request_id = models.AutoField(primary_key=True)
    student = models.ForeignKey(
        "accounts.CustomUser",
        on_delete=models.CASCADE,
        db_column="student_id",
        related_name="created_requests",
    )
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPE_CHOICES)
    request_date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    description = models.TextField(blank=True)
    accepted_by = models.ForeignKey(
        "accounts.CustomUser",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        db_column="accepted_by_user_id",
        related_name="accepted_requests",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Request #{self.request_id} ({self.request_type}) - {self.status}"

    def clean(self):
        if self.start_time and self.end_time and self.end_time <= self.start_time:
            raise ValidationError("end_time must be after start_time")


class TransportDetails(models.Model):
    request = models.OneToOneField(
        Request,
        on_delete=models.CASCADE,
        primary_key=True,
        db_column="request_id",
        related_name="transport_details",
    )
    pickup_address = models.CharField(max_length=255)
    dropoff_address = models.CharField(max_length=255)

    class Meta:
        db_table = "transport_details"

    def __str__(self):
        return f"Transport #{self.request_id}: {self.pickup_address} → {self.dropoff_address}"


class ServiceDetails(models.Model):
    request = models.OneToOneField(
        Request,
        on_delete=models.CASCADE,
        primary_key=True,
        db_column="request_id",
        related_name="service_details",
    )
    service_category = models.CharField(max_length=100)
    location = models.CharField(max_length=255)

    class Meta:
        db_table = "service_details"

    def __str__(self):
        return f"Service #{self.request_id}: {self.service_category} @ {self.location}"
