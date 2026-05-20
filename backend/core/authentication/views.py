from django.shortcuts import render

# Create your views here.
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import logout, update_session_auth_hash
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
import jwt
import json
import hashlib
import secrets
from datetime import datetime, timedelta

from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, 
    UserProfileSerializer, GoogleAuthSerializer, ChangePasswordSerializer
)
from .models import CustomUser, PQCSession
from .pqc import PostQuantumCrypto

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    try:
        serializer = UserRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate PQC session
            pqc_keys = PostQuantumCrypto.generate_keypair()
            token = PostQuantumCrypto.generate_session_token()
            
            session = PQCSession.objects.create(
                user=user,
                token=token,
                public_key=pqc_keys['public_key'],
                private_key_encrypted=pqc_keys['private_key'],
                expires_at=timezone.now() + timedelta(days=7)
            )
            
            return Response({
                'success': True,
                'message': 'User registered successfully',
                'user': UserProfileSerializer(user).data,
                'token': token,
                'pqc_public_key': session.public_key
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    try:
        serializer = UserLoginSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            user.last_login = timezone.now()
            user.save()
            
            # Generate new PQC session
            pqc_keys = PostQuantumCrypto.generate_keypair()
            token = PostQuantumCrypto.generate_session_token()
            
            # Invalidate old sessions
            PQCSession.objects.filter(user=user, is_active=True).update(is_active=False)
            
            session = PQCSession.objects.create(
                user=user,
                token=token,
                public_key=pqc_keys['public_key'],
                private_key_encrypted=pqc_keys['private_key'],
                expires_at=timezone.now() + timedelta(hours=24)
            )
            
            # Generate JWT token
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'success': True,
                'message': 'Login successful',
                'user': UserProfileSerializer(user).data,
                'token': token,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'pqc_public_key': session.public_key
            }, status=status.HTTP_200_OK)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_401_UNAUTHORIZED)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    """Manual Google token verification (without allauth)"""
    try:
        serializer = GoogleAuthSerializer(data=request.data)
        
        if serializer.is_valid():
            access_token = serializer.validated_data['access_token']
            
            # Decode JWT token from Google (manual verification)
            try:
                # For demo, we'll decode without verification
                # In production, verify with Google's public keys
                decoded = jwt.decode(access_token, options={"verify_signature": False})
                
                email = decoded.get('email')
                first_name = decoded.get('given_name', '')
                last_name = decoded.get('family_name', '')
                
                if not email:
                    return Response({
                        'success': False,
                        'error': 'Email not provided'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Get or create user
                user = CustomUser.objects.filter(email=email).first()
                is_new_user = False
                
                if not user:
                    unique_username = PostQuantumCrypto.generate_unique_username()
                    
                    # Ensure unique username
                    while CustomUser.objects.filter(username=unique_username).exists():
                        unique_username = PostQuantumCrypto.generate_unique_username()
                    
                    user = CustomUser.objects.create_user(
                        email=email,
                        username=unique_username,
                        first_name=first_name,
                        last_name=last_name,
                        password=None
                    )
                    is_new_user = True
                
                user.last_login = timezone.now()
                user.save()
                
                # Generate PQC session
                pqc_keys = PostQuantumCrypto.generate_keypair()
                token = PostQuantumCrypto.generate_session_token()
                
                PQCSession.objects.filter(user=user, is_active=True).update(is_active=False)
                
                session = PQCSession.objects.create(
                    user=user,
                    token=token,
                    public_key=pqc_keys['public_key'],
                    private_key_encrypted=pqc_keys['private_key'],
                    expires_at=timezone.now() + timedelta(hours=24)
                )
                
                # Generate JWT token
                refresh = RefreshToken.for_user(user)
                
                return Response({
                    'success': True,
                    'message': 'Google authentication successful',
                    'user': UserProfileSerializer(user).data,
                    'token': token,
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'pqc_public_key': session.public_key,
                    'is_new_user': is_new_user
                }, status=status.HTTP_200_OK)
                
            except jwt.InvalidTokenError:
                return Response({
                    'success': False,
                    'error': 'Invalid Google token'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)






# =========================// FOR UPLOADING PROFILE PICTURE  //=============
# Add these imports at the top of views.py if not already present
import base64

# Then add these views at the bottom of views.py

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    try:
        user = request.user
        data = request.data
        
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'middle_name' in data:
            user.middle_name = data['middle_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'mobile_number' in data:
            user.mobile_number = data['mobile_number']
        if 'profile_picture' in data:
            user.profile_picture = data['profile_picture']
        
        user.save()
        
        from .serializers import UserProfileSerializer
        serializer = UserProfileSerializer(user)
        return Response({
            'success': True,
            'message': 'Profile updated successfully',
            'user': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_profile_picture(request):
    try:
        profile_picture = request.data.get('profile_picture')
        
        if not profile_picture:
            return Response({
                'success': False,
                'error': 'No profile picture provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate base64 format
        try:
            if profile_picture.startswith('data:image'):
                header, encoded = profile_picture.split(',', 1)
                base64.b64decode(encoded)
            else:
                base64.b64decode(profile_picture)
        except Exception:
            return Response({
                'success': False,
                'error': 'Invalid image format'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        user.profile_picture = profile_picture
        user.save()
        
        from .serializers import UserProfileSerializer
        serializer = UserProfileSerializer(user)
        
        return Response({
            'success': True,
            'message': 'Profile picture updated successfully',
            'profile_picture': profile_picture,
            'user': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




# ==========================ADDRESS VIEWS //================
# Add to existing imports
from .models import CustomUser, PQCSession, Address
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, 
    UserProfileSerializer, GoogleAuthSerializer, ChangePasswordSerializer,
    AddressSerializer, UpdateAddressSerializer
)

# Address Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_address(request):
    """Get user's address"""
    try:
        address, created = Address.objects.get_or_create(user=request.user)
        serializer = AddressSerializer(address)
        return Response({
            'success': True,
            'address': serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_address(request):
    """Create or update user's address"""
    try:
        address, created = Address.objects.get_or_create(user=request.user)
        serializer = AddressSerializer(address, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Address saved successfully',
                'address': serializer.data
            }, status=status.HTTP_200_OK)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_address(request):
    """Update user's address"""
    try:
        address = Address.objects.get(user=request.user)
        serializer = AddressSerializer(address, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Address updated successfully',
                'address': serializer.data
            }, status=status.HTTP_200_OK)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
        
    except Address.DoesNotExist:
        # Create new address if doesn't exist
        serializer = AddressSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response({
                'success': True,
                'message': 'Address created successfully',
                'address': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_address(request):
    """Delete user's address"""
    try:
        address = Address.objects.get(user=request.user)
        address.delete()
        return Response({
            'success': True,
            'message': 'Address deleted successfully'
        }, status=status.HTTP_200_OK)
    except Address.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Address not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =====================// FOR UPLOADING PROFILE PICTURE //=========================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            token = auth_header.split(' ')[1]
            PQCSession.objects.filter(token=token, is_active=True).update(is_active=False)
        
        logout(request)
        
        return Response({
            'success': True,
            'message': 'Logged out successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    try:
        serializer = UserProfileSerializer(request.user)
        return Response({
            'success': True,
            'user': serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    try:
        user = request.user
        data = request.data
        
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'middle_name' in data:
            user.middle_name = data['middle_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'mobile_number' in data:
            user.mobile_number = data['mobile_number']
        
        user.save()
        
        serializer = UserProfileSerializer(user)
        return Response({
            'success': True,
            'message': 'Profile updated successfully',
            'user': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    try:
        serializer = ChangePasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            user = request.user
            
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({
                    'success': False,
                    'error': 'Wrong password'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            # Invalidate all sessions
            PQCSession.objects.filter(user=user, is_active=True).update(is_active=False)
            
            return Response({
                'success': True,
                'message': 'Password changed successfully. Please login again.'
            }, status=status.HTTP_200_OK)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_sessions(request):
    try:
        sessions = PQCSession.objects.filter(
            user=request.user,
            is_active=True,
            expires_at__gt=timezone.now()
        )
        
        data = [{
            'id': str(s.id),
            'created_at': s.created_at,
            'expires_at': s.expires_at,
            'last_used_at': s.last_used_at,
            'is_active': s.is_active
        } for s in sessions]
        
        return Response({
            'success': True,
            'sessions': data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pqc_encrypt(request):
    try:
        data = request.data.get('data')
        if not data:
            return Response({
                'success': False,
                'error': 'No data provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        session = PQCSession.objects.filter(
            user=request.user,
            is_active=True
        ).first()
        
        if not session:
            return Response({
                'success': False,
                'error': 'No active session found'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        from .pqc import PQCEncryption
        encrypted = PQCEncryption.encrypt_message(data, session.public_key)
        
        return Response({
            'success': True,
            'encrypted': encrypted
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)