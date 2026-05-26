import secrets
from dataclasses import dataclass
from typing import Callable

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from app.config import get_settings


security = HTTPBasic()


@dataclass(frozen=True)
class AuthUser:
    username: str
    role: str


def _demo_users() -> dict[str, tuple[str, str]]:
    """
    Демонстрационные учетные записи.
    Используем HTTP Basic без JWT, чтобы не добавлять зависимости.
    """
    s = get_settings()
    return {
        s.auth_admin_username: (s.auth_admin_password, "admin"),
        s.auth_manager_username: (s.auth_manager_password, "manager"),
        s.auth_user_username: (s.auth_user_password, "user"),
        s.auth_guest_username: (s.auth_guest_password, "guest"),
    }


def get_current_user(
    credentials: HTTPBasicCredentials = Security(security),
) -> AuthUser:
    users = _demo_users()
    user = users.get(credentials.username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )

    expected_password, role = user
    if not secrets.compare_digest(credentials.password, expected_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )

    return AuthUser(username=credentials.username, role=role)


def require_roles(*allowed_roles: str) -> Callable[[AuthUser], AuthUser]:
    allowed: set[str] = set(allowed_roles)

    def _authorizer(user: AuthUser = Depends(get_current_user)) -> AuthUser:
        if user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions",
            )
        return user

    return _authorizer

