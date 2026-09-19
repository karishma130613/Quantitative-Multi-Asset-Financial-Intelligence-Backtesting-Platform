import os
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import field_validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "QUANTLAB"
    PROJECT_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    
    # Security
    SECRET_KEY: str = "quantlab_super_secure_quant_jwt_key_2025_entropy_99881122"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database (PostgreSQL support, SQLite fallback)
    DATABASE_URL: str = "sqlite:///./quantlab.db"
    
    # AI & Quantitative Research
    RESEARCH_API_KEY: str = ""
    
    # CORS
    CORS_ORIGINS: Union[str, List[str]] = "*"

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v):
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        return ["*"]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
