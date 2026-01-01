
import os
from pydantic_settings import BaseSettings
from pydantic import Field, AliasChoices
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "RemoteHive Super Admin"
    API_V1_STR: str = "/api/v1"
    
    # Supabase
    SUPABASE_URL: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices(
            "SUPABASE_URL",
            "NEXT_PUBLIC_SUPABASE_URL",
            "VITE_SUPABASE_URL",
        ),
    )
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices(
            "SUPABASE_SERVICE_ROLE_KEY",
            "SUPABASE_SERVICE_KEY",
            "SUPABASE_KEY",
        ),
    )
    
    # Clerk
    CLERK_SECRET_KEY: Optional[str] = None
    
    # Internal Auth
    ADMIN_SECRET_KEY: str = "RemoteHiveSecretKey2025"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
