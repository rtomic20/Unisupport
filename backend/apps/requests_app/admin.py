from django.contrib import admin
from .models import Request, TransportDetails, ServiceDetails

admin.site.register(Request)
admin.site.register(TransportDetails)
admin.site.register(ServiceDetails)
