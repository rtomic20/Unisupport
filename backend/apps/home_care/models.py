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
    )
    caregiver = models.ForeignKey(
        "accounts.CustomUser",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="caregiver_appointments",
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
