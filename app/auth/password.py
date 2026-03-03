"""
Password Hashing Utilities
Using bcrypt directly (avoids passlib/bcrypt 4.1+ compatibility issues).
"""
import bcrypt

# Bcrypt only supports passwords up to 72 bytes
BCRYPT_MAX_PASSWORD_BYTES = 72


def _to_bytes(password: str) -> bytes:
    """Encode password to bytes and truncate to bcrypt limit."""
    if isinstance(password, str):
        password = password.encode("utf-8")
    return password[:BCRYPT_MAX_PASSWORD_BYTES]


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    try:
        return bcrypt.checkpw(
            _to_bytes(plain_password),
            hashed_password.encode("utf-8") if isinstance(hashed_password, str) else hashed_password,
        )
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Generate a bcrypt hash for a password."""
    return bcrypt.hashpw(_to_bytes(password), bcrypt.gensalt()).decode("utf-8")

