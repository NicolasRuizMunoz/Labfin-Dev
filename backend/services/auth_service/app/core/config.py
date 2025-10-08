# app/core/config.py
from urllib.parse import quote_plus
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Pydantic v2: configuración del modelo
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",          # ignora variables que no existan en el modelo
        case_sensitive=False,    # DB_HOST == db_host
    )

    APP_NAME: str = "service_users"

    # DB
    DB_HOST: str
    DB_PORT: int = 3306
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 180
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173"]

    # Google (opcional para /auth/google)
    GOOGLE_CLIENT_ID: Optional[str] = None

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        pwd = quote_plus(self.DB_PASSWORD)
        return f"mysql+pymysql://{self.DB_USER}:{pwd}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"

settings = Settings()
