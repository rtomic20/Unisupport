from django.urls import path
from .views import UserListCreateView, UserDetailView, RoleListCreateView, RoleDetailView

urlpatterns = [
    path("users/", UserListCreateView.as_view(), name="users_list"),
    path("users/<int:user_id>/", UserDetailView.as_view(), name="user_detail"),
    path("roles/", RoleListCreateView.as_view(), name="roles_list"),
    path("roles/<int:role_id>/", RoleDetailView.as_view(), name="role_detail"),
]
