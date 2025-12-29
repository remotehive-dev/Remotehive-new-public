
import os
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "RemoteHive Super Admin"
    API_V1_STR: str = "/api/v1"
    
    # Supabase
    SUPABASE_URL: str = Field(alias="NEXT_PUBLIC_SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY: str
    
    # Clerk
    CLERK_SECRET_KEY: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
