from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.utils import timezone
from .models import PQCSession
import logging

logger = logging.getLogger(__name__)

class PQCAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return None
        
        try:
            parts = auth_header.split()
            
            if len(parts) != 2 or parts[0].lower() != 'bearer':
                raise AuthenticationFailed('Invalid authorization header format')
            
            token = parts[1]
            
            try:
                session = PQCSession.objects.select_related('user').get(
                    token=token,
                    is_active=True
                )
            except PQCSession.DoesNotExist:
                raise AuthenticationFailed('Invalid or expired token')
            
            if session.expires_at < timezone.now():
                session.is_active = False
                session.save()
                raise AuthenticationFailed('Token has expired')
            
            if not session.user.is_active:
                raise AuthenticationFailed('User account is disabled')
            
            session.last_used_at = timezone.now()
            session.save()
            
            return (session.user, token)
            
        except AuthenticationFailed:
            raise
        except Exception as e:
            raise AuthenticationFailed(f'Authentication failed')
    
    def authenticate_header(self, request):
        return 'Bearer realm="api"'










