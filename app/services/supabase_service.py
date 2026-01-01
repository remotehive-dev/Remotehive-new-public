
from supabase import create_client, Client
from app.core.config import settings
from typing import Optional

class SupabaseService:
    _client: Optional[Client] = None

    @classmethod
    def get_client(cls) -> Client:
        if not cls._client:
            # Fallback to os.environ if settings fail (sometimes Pydantic validation is tricky with Railway)
            import os
            url = settings.SUPABASE_URL or os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
            key = settings.SUPABASE_SERVICE_ROLE_KEY or os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_KEY")

            if not url:
                raise RuntimeError(
                    "Supabase URL is not configured. Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL / VITE_SUPABASE_URL)."
                )
            if not key:
                raise RuntimeError(
                    "Supabase service role key is not configured. Set SUPABASE_SERVICE_ROLE_KEY."
                )
            cls._client = create_client(url, key)
        return cls._client

def get_supabase() -> Client:
    return SupabaseService.get_client()
