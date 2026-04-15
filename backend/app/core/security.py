"""JWT signing/verification and bcrypt password hashing."""
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 8

_bearer_scheme = HTTPBearer()


def _get_secret_key() -> str:
    key = os.getenv("JWT_SECRET_KEY", "")
    if not key:
        raise RuntimeError("JWT_SECRET_KEY environment variable is not set.")
    return key


# ---------------------------------------------------------------------------
# Password helpers
# ---------------------------------------------------------------------------

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# ---------------------------------------------------------------------------
# Token helpers
# ---------------------------------------------------------------------------

def create_access_token(user_id: int) -> str:
    """Return a signed JWT containing the user id as the 'sub' claim."""
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, _get_secret_key(), algorithm=ALGORITHM)


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------

def get_current_user_id(
    creds: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> int:
    """
    FastAPI dependency that validates the Bearer token and returns the user id.

    Usage:
        @router.get("/protected")
        def protected(user_id: int = Depends(get_current_user_id)):
            ...
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(creds.credentials, _get_secret_key(), algorithms=[ALGORITHM])
        sub: Optional[str] = payload.get("sub")
        if sub is None:
            raise credentials_exception
        return int(sub)
    except JWTError:
        raise credentials_exception
