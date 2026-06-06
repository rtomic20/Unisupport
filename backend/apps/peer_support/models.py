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
    )
    assistant = models.ForeignKey(
        "accounts.CustomUser",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_plans",
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
