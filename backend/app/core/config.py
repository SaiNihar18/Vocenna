import json
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Vocenna"
    ENVIRONMENT: str = "local"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "change_this_super_secret_key_in_production_32bytes_min"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://localhost:5173", "http://localhost:8000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",")]
        return v

    # PostgreSQL
    POSTGRES_USER: str = "vocenna"
    POSTGRES_PASSWORD: str = "vocenna_password"
    POSTGRES_DB: str = "vocenna_db"
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: str = "postgresql+asyncpg://vocenna:vocenna_password@postgres:5432/vocenna_db"
    SYNC_DATABASE_URL: str = "postgresql+psycopg2://vocenna:vocenna_password@postgres:5432/vocenna_db"

    # Redis
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_URL: str = "redis://redis:6379/0"

    # Celery
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/0"

    # AI & Speech Service Interfaces Configuration
    STT_SERVICE_TYPE: str = "whisper_local"  # whisper_local | cloud_api
    WHISPER_MODEL_SIZE: str = "base"

    LLM_SERVICE_TYPE: str = "ollama"  # ollama | huggingface | cloud_api
    OLLAMA_BASE_URL: str = "http://host.docker.internal:11434"
    OLLAMA_MODEL: str = "llama3"

    OPENAI_API_KEY: str = ""
    HUGGINGFACE_HUB_TOKEN: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
