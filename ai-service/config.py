from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    ai_service_env: str = Field(default="local", alias="AI_SERVICE_ENV")
    ai_service_host: str = Field(default="0.0.0.0", alias="AI_SERVICE_HOST")
    ai_service_port: int = Field(default=8010, alias="AI_SERVICE_PORT")
    ai_service_reload: bool = Field(default=True, alias="AI_SERVICE_RELOAD")

    db_host: str = Field(default="127.0.0.1", alias="DB_HOST")
    db_port: int = Field(default=5432, alias="DB_PORT")
    db_name: str = Field(default="vibespot_db", alias="DB_NAME")
    db_user: str = Field(default="postgres", alias="DB_USER")
    db_password: str = Field(default="", alias="DB_PASSWORD")
    db_sslmode: str = Field(default="prefer", alias="DB_SSLMODE")

    recommendation_default_limit: int = Field(default=20, alias="RECOMMENDATION_DEFAULT_LIMIT")
    recommendation_max_limit: int = Field(default=100, alias="RECOMMENDATION_MAX_LIMIT")

    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-2.5-flash", alias="GEMINI_MODEL")
    gemini_timeout_seconds: int = Field(default=25, alias="GEMINI_TIMEOUT_SECONDS")


settings = Settings()
