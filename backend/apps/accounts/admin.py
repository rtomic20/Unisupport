from django.contrib import admin
from .models import CustomUser, Role

admin.site.register(Role)
admin.site.register(CustomUser)
