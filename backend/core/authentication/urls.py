from django.urls import path
from . import views

urlpatterns = [
    path('api/register/', views.register, name='register'),
    path('api/login/', views.login, name='login'),
    path('api/google-auth/', views.google_auth, name='google_auth'),
    path('api/logout/', views.logout_view, name='logout'),
    path('api/profile/', views.profile, name='profile'),
    path('api/profile/update/', views.update_profile, name='update_profile'),
    path('api/change-password/', views.change_password, name='change_password'),
    path('api/sessions/', views.get_sessions, name='get_sessions'),
    path('api/pqc-encrypt/', views.pqc_encrypt, name='pqc_encrypt'),
    path('api/upload-profile-picture/', views.upload_profile_picture, name='upload_profile_picture'),
       
        # Address endpoints
    path('api/address/', views.get_address, name='get_address'),
    path('api/address/create/', views.create_address, name='create_address'),
    path('api/address/update/', views.update_address, name='update_address'),
    path('api/address/delete/', views.delete_address, name='delete_address'),
]