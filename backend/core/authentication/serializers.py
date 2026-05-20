from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser, PQCSession
import re
import base64

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=True)
    profile_picture = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = CustomUser
        fields = [
            'email', 'username', 'first_name', 'middle_name', 
            'last_name', 'mobile_number', 'profile_picture', 'password', 'confirm_password'
        ]
    
    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value.lower()
    
    def validate_username(self, value):
        if not re.match(r'^AC-\d{5}$', value):
            raise serializers.ValidationError("Username must follow format AC-XXXXX")
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value
    
    def validate_profile_picture(self, value):
        if value:
            # Validate base64 format
            try:
                # Check if it's a valid base64 string
                if value.startswith('data:image'):
                    # Extract the base64 part
                    header, encoded = value.split(',', 1)
                    base64.b64decode(encoded)
                else:
                    base64.b64decode(value)
            except Exception:
                raise serializers.ValidationError("Invalid profile picture format")
        return value
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords don't match"})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        user = CustomUser.objects.create_user(**validated_data, password=password)
        return user



class UserLoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        identifier = attrs.get('identifier')
        password = attrs.get('password')
        
        if '@' in identifier:
            try:
                user = CustomUser.objects.get(email=identifier.lower())
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError("Invalid credentials")
        else:
            try:
                user = CustomUser.objects.get(username=identifier)
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError("Invalid credentials")
        
        user = authenticate(username=user.email, password=password)
        
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        
        if not user.is_active:
            raise serializers.ValidationError("User account is disabled")
        
        attrs['user'] = user
        return attrs

class GoogleAuthSerializer(serializers.Serializer):
    access_token = serializers.CharField(required=True)



# =========================// ADDRESS SERIALIZER //================
from .models import CustomUser, PQCSession, Address

# Address Serializer
class AddressSerializer(serializers.ModelSerializer):
    full_address = serializers.SerializerMethodField()
    
    class Meta:
        model = Address
        fields = [
            'id', 'country', 'street_address', 'apartment', 'city', 'state',
            'postal_code', 'tax_id', 'is_billing_address', 'is_shipping_address',
            'full_address', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_full_address(self, obj):
        return obj.get_full_address()



class UpdateAddressSerializer(serializers.Serializer):
    country = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    street_address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    apartment = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    city = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    state = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    postal_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    tax_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    is_billing_address = serializers.BooleanField(required=False)
    is_shipping_address = serializers.BooleanField(required=False)


class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    address = AddressSerializer(read_only=True)
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'username', 'first_name', 'middle_name', 
            'last_name', 'full_name', 'mobile_number', 'profile_picture',
            'address', 'created_at', 'last_login', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'last_login']
    
    def get_full_name(self, obj):
        parts = [obj.first_name]
        if obj.middle_name:
            parts.append(obj.middle_name)
        parts.append(obj.last_name)
        return ' '.join(parts)






# ============================// UPDATE PROFILE SERIALIZER //================

class UpdateProfileSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False)
    middle_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    last_name = serializers.CharField(required=False)
    mobile_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    profile_picture = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    def validate_profile_picture(self, value):
        if value:
            try:
                if value.startswith('data:image'):
                    header, encoded = value.split(',', 1)
                    base64.b64decode(encoded)
                else:
                    base64.b64decode(value)
            except Exception:
                raise serializers.ValidationError("Invalid profile picture format")
        return value
    
    def get_full_name(self, obj):
        parts = [obj.first_name]
        if obj.middle_name:
            parts.append(obj.middle_name)
        parts.append(obj.last_name)
        return ' '.join(parts)

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    confirm_password = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords don't match"})
        return attrs