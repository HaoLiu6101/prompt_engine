from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    app_name: str = "prompt-engine-backend"
    app_env: str = "dev"
    api_v1_prefix: str = "/api/v1"
    database_url: str
    jwt_secret: str | None = None
    jwt_algorithm: str = "HS256"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def is_dev(self) -> bool:
        return self.app_env.lower() == "dev"

    @property
    def is_prod(self) -> bool:
        return self.app_env.lower() == "prod"


def get_settings() -> Settings:
    return _get_settings()


@lru_cache
def _get_settings() -> Settings:
    return Settings()  # type: ignore[arg-type]
