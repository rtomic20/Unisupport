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
