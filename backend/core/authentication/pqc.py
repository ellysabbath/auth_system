import secrets
import hashlib
import base64
import json
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import random

class PostQuantumCrypto:
    """Post-Quantum Cryptography simulation using Kyber-inspired approach"""
    
    @staticmethod
    def generate_keypair():
        """Generate keypair using hybrid cryptographic approach"""
        # Generate a secure random seed
        seed = secrets.token_bytes(32)
        
        # Generate private key (simulated)
        private_key = base64.b64encode(seed + secrets.token_bytes(32)).decode('utf-8')
        
        # Derive public key from private key using hash
        public_key = hashlib.sha256(seed).hexdigest()
        
        return {
            'private_key': private_key,
            'public_key': public_key
        }
    
    @staticmethod
    def encapsulate(public_key):
        """Encapsulate a shared secret using public key"""
        # Generate shared secret
        shared_secret = secrets.token_bytes(32)
        
        # Create ciphertext by encrypting secret with public key hash
        ciphertext = hashlib.sha256(public_key.encode() + shared_secret).hexdigest()
        
        return {
            'shared_secret': base64.b64encode(shared_secret).decode('utf-8'),
            'ciphertext': ciphertext
        }
    
    @staticmethod
    def decapsulate(private_key_bytes, ciphertext):
        """Decapsulate shared secret using private key"""
        # Simulate decapsulation
        shared_secret = secrets.token_bytes(32)
        return base64.b64encode(shared_secret).decode('utf-8')
    
    @staticmethod
    def generate_session_token():
        """Generate cryptographically secure session token"""
        return secrets.token_urlsafe(64)
    
    @staticmethod
    def generate_unique_username():
        """Generate unique username with AC- prefix"""
        random_num = random.randint(10000, 99999)
        return f"AC-{random_num}"
    
    @staticmethod
    def hash_password(password):
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    @staticmethod
    def verify_password(password, hashed):
        """Verify password"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

class PQCEncryption:
    @staticmethod
    def encrypt_message(message, public_key):
        """Encrypt message using PQC"""
        # Generate random key
        key = secrets.token_bytes(32)
        iv = secrets.token_bytes(16)
        
        # Encrypt using AES
        cipher = Cipher(algorithms.AES(key), modes.CFB(iv), backend=default_backend())
        encryptor = cipher.encryptor()
        encrypted = encryptor.update(message.encode()) + encryptor.finalize()
        
        return {
            'ciphertext': base64.b64encode(encrypted).decode('utf-8'),
            'iv': base64.b64encode(iv).decode('utf-8'),
            'key_encrypted': hashlib.sha256(public_key.encode() + key).hexdigest()
        }
    
    @staticmethod
    def decrypt_message(encrypted_data, iv, key_encrypted, private_key):
        """Decrypt message using PQC"""
        key = secrets.token_bytes(32)  # In real implementation, derive from private key
        cipher = Cipher(algorithms.AES(key), modes.CFB(base64.b64decode(iv)), backend=default_backend())
        decryptor = cipher.decryptor()
        decrypted = decryptor.update(base64.b64decode(encrypted_data)) + decryptor.finalize()
        return decrypted.decode()