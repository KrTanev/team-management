import hashlib
import hmac
import secrets

from fastapi import Depends, Header
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import config
from app.db import get_db
from app.errors import ApiError
from app.models import AuthToken, User

# scrypt parameters — identical in backend-node so seeded hashes are portable.
_N, _R, _P, _DKLEN = 2**14, 8, 1, 64


def hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=_N, r=_R, p=_P, dklen=_DKLEN)
    return f"scrypt${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _algo, salt_hex, digest_hex = stored.split("$")
    except ValueError:
        return False
    candidate = hash_password(password, bytes.fromhex(salt_hex)).split("$")[2]
    return hmac.compare_digest(candidate, digest_hex)


def issue_token(db: Session, user: User) -> str:
    token = secrets.token_urlsafe(config.TOKEN_BYTES)
    db.add(AuthToken(token=token, user_id=user.id))
    db.commit()
    return token


def bearer_token(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise ApiError(401, "Missing bearer token")
    return authorization[7:].strip()


def current_user(token: str = Depends(bearer_token), db: Session = Depends(get_db)) -> User:
    row = db.execute(
        select(User).join(AuthToken, AuthToken.user_id == User.id).where(AuthToken.token == token)
    ).scalar_one_or_none()
    if row is None:
        raise ApiError(401, "Invalid or expired token")
    return row


def require_admin(user: User) -> None:
    if user.role != "admin":
        raise ApiError(403, "Admin only")
