"""Password hashing, signed session cookies and request throttling."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time
from collections import defaultdict

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import settings
from .db import get_db
from .models import AdminUser

COOKIE_NAME = "nk_admin"
SESSION_MAX_AGE = settings.session_days * 24 * 3600

_SCRYPT_N = 2**14
_SCRYPT_R = 8
_SCRYPT_P = 1
_SCRYPT_LEN = 32


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=_SCRYPT_N,
        r=_SCRYPT_R,
        p=_SCRYPT_P,
        dklen=_SCRYPT_LEN,
        maxmem=64 * 1024 * 1024,
    )
    return "scrypt${}${}${}${}${}".format(
        _SCRYPT_N,
        _SCRYPT_R,
        _SCRYPT_P,
        salt.hex(),
        digest.hex(),
    )


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, n, r, p, salt_hex, digest_hex = stored.split("$")
        if scheme != "scrypt":
            return False
        digest = hashlib.scrypt(
            password.encode("utf-8"),
            salt=bytes.fromhex(salt_hex),
            n=int(n),
            r=int(r),
            p=int(p),
            dklen=len(bytes.fromhex(digest_hex)),
            maxmem=64 * 1024 * 1024,
        )
        return hmac.compare_digest(digest, bytes.fromhex(digest_hex))
    except (ValueError, TypeError):
        return False


def _signature(payload: bytes) -> str:
    return hmac.new(
        settings.secret_key.encode("utf-8"), payload, hashlib.sha256
    ).hexdigest()


def create_session_token(email: str) -> str:
    payload = json.dumps(
        {"sub": email, "exp": int(time.time()) + SESSION_MAX_AGE}
    ).encode("utf-8")
    encoded = base64.urlsafe_b64encode(payload).decode("ascii").rstrip("=")
    return encoded + "." + _signature(payload)


def verify_session_token(token: str | None) -> str | None:
    if not token or "." not in token:
        return None
    encoded, signature = token.rsplit(".", 1)
    try:
        payload = base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4))
    except ValueError:
        return None
    if not hmac.compare_digest(signature, _signature(payload)):
        return None
    try:
        data = json.loads(payload)
    except ValueError:
        return None
    if not isinstance(data, dict) or int(data.get("exp", 0)) < int(time.time()):
        return None
    return str(data.get("sub") or "") or None


def current_admin(request: Request, db: Session = Depends(get_db)) -> AdminUser | None:
    email = verify_session_token(request.cookies.get(COOKIE_NAME))
    if not email:
        return None
    return db.scalar(select(AdminUser).where(AdminUser.email == email))


def require_admin(admin: AdminUser | None = Depends(current_admin)) -> AdminUser:
    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Prijava je potrebna.",
        )
    return admin


# --------------------------------------------------------------------- throttle
def client_ip(request: Request) -> str:
    """Return the visitor IP, honouring the proxy header used by Render."""
    if settings.trust_proxy:
        forwarded = request.headers.get("x-forwarded-for", "")
        first = forwarded.split(",")[0].strip()
        if first:
            return first
    return request.client.host if request.client else "unknown"


_attempts: dict[str, list[float]] = defaultdict(list)
_WINDOW = 10 * 60
_MAX_ATTEMPTS = 8


def login_allowed(ip: str) -> bool:
    now = time.time()
    recent = [stamp for stamp in _attempts[ip] if now - stamp < _WINDOW]
    _attempts[ip] = recent
    return len(recent) < _MAX_ATTEMPTS


def register_failed_login(ip: str) -> None:
    _attempts[ip].append(time.time())


def clear_login_attempts(ip: str) -> None:
    _attempts.pop(ip, None)


# Generic per-IP limiter for public endpoints (orders, order lookup, retry).
_limits: dict[tuple[str, str], list[float]] = defaultdict(list)


def rate_limit(request: Request, bucket: str, limit: int, window: int = 600) -> None:
    """Raise HTTP 429 when an IP exceeds ``limit`` calls in ``window`` seconds."""
    key = (bucket, client_ip(request))
    now = time.time()
    recent = [stamp for stamp in _limits[key] if now - stamp < window]
    if len(recent) >= limit:
        _limits[key] = recent
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Preveč zahtev. Poskusite znova čez nekaj minut.",
            headers={"Retry-After": str(window)},
        )
    recent.append(now)
    _limits[key] = recent


def reset_rate_limits() -> None:
    """Clear in-memory counters (used by tests and after configuration reload)."""
    _limits.clear()
    _attempts.clear()
