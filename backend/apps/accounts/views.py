from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import CustomUser, Role
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer,
    RoleSerializer,
)
from .permissions import IsAdmin


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class UserListCreateView(generics.ListCreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        qs = CustomUser.objects.select_related("role").order_by("last_name", "first_name")
        role_name = self.request.query_params.get("role")
        if role_name:
            qs = qs.filter(role__role_name=role_name)
        return qs


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = CustomUser.objects.select_related("role").all()
    lookup_field = "user_id"


class RoleListCreateView(generics.ListCreateAPIView):
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = Role.objects.all()


class RoleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = Role.objects.all()
    lookup_field = "role_id"
