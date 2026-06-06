from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models


class Role(models.Model):
    role_id = models.AutoField(primary_key=True)
    role_name = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = "roles"

    def __str__(self):
        return self.role_name


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        admin_role, _ = Role.objects.get_or_create(role_name="admin")
        extra_fields.setdefault("role", admin_role)
        extra_fields.setdefault("first_name", "Admin")
        extra_fields.setdefault("last_name", "User")
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser):
    user_id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=30, blank=True)
    role = models.ForeignKey(
        Role,
        on_delete=models.PROTECT,
        db_column="role_id",
        related_name="users",
    )
    is_active = models.BooleanField(default=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = CustomUserManager()

    class Meta:
        db_table = "users"

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

    @property
    def role_name(self):
        return self.role.role_name
