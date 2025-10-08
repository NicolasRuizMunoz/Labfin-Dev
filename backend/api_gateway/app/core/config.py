from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    APP_NAME: str = "LabFin API Gateway"
    # Orígenes del front
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:5174"]

    # Servicios
    AUTH_SERVICE_URL: str = "http://127.0.0.1:8001"  # tu service_users (auth_service)
    DATA_SERVICE_URL: str | None = None

    # JWT – solo si quisieras validar en el gateway (por ahora delegamos en auth_service)
    JWT_ALG: str = "HS256"
    JWT_SECRET: str | None = None

    # Cookies
    COOKIE_ACCESS_NAME: str = "access_token"
    COOKIE_REFRESH_NAME: str = "refresh_token"
    COOKIE_SECURE: bool = False   # True en prod detrás de HTTPS
    COOKIE_DOMAIN: str | None = None
    COOKIE_SAMESITE: str = "lax"  # "none" si usas cross-site con HTTPS

settings = Settings()
