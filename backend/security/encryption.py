import base64
from cryptography.fernet import Fernet, InvalidToken
from backend.config import settings

# Initialize Fernet cipher with symmetric key from environment
try:
    _cipher = Fernet(settings.FERNET_ENCRYPTION_KEY.encode('utf-8'))
except Exception as e:
    # If the key provided in env is not valid 32 url-safe base64, generate or pad safely
    import hashlib
    _raw_key = hashlib.sha256(settings.FERNET_ENCRYPTION_KEY.encode('utf-8')).digest()
    _b64_key = base64.urlsafe_b64encode(_raw_key)
    _cipher = Fernet(_b64_key)

def encrypt_field(plain_text: str | None) -> str | None:
    """
    Encrypts a sensitive string field using AES-128-CBC + HMAC-SHA256 (Fernet).
    Returns base64-encoded ciphertext string.
    """
    if plain_text is None:
        return None
    if not isinstance(plain_text, str):
        plain_text = str(plain_text)
    encrypted_bytes = _cipher.encrypt(plain_text.encode('utf-8'))
    return encrypted_bytes.decode('utf-8')

def decrypt_field(cipher_text: str | None) -> str | None:
    """
    Decrypts a Fernet ciphertext string back to plaintext.
    If input is not encrypted or invalid, safely handles error.
    """
    if cipher_text is None:
        return None
    if not isinstance(cipher_text, str):
        return str(cipher_text)
    try:
        decrypted_bytes = _cipher.decrypt(cipher_text.encode('utf-8'))
        return decrypted_bytes.decode('utf-8')
    except (InvalidToken, Exception):
        # Fallback if field was stored unencrypted during initial migration
        return cipher_text
