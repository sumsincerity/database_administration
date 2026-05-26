from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Internet Shop API"
    mongo_url: str = "mongodb://admin:password@localhost:27017"
    mongo_db_name: str = "shop"

    # Auth (HTTP Basic) demo users used by the frontend.
    # Credentials can be overridden via environment variables.
    auth_realm: str = "shop"
    auth_admin_username: str = "shop_admin"
    auth_admin_password: str = "admin123"
    auth_manager_username: str = "shop_manager"
    auth_manager_password: str = "manager123"
    auth_user_username: str = "shop_user"
    auth_user_password: str = "user123"
    auth_guest_username: str = "shop_guest"
    auth_guest_password: str = "guest123"

    # Defaults for local uvicorn (Docker Compose maps primary to localhost:54320).
    postgres_host: str = "localhost"
    postgres_port: int = 54320
    postgres_db: str = "shop_postgres"
    postgres_user: str = "postgres"
    postgres_password: str = "postgres"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
