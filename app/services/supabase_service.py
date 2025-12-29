
from supabase import create_client, Client
from app.core.config import settings

class SupabaseService:
    _client: Client = None

    @classmethod
    def get_client(cls) -> Client:
        if not cls._client:
            cls._client = create_client(
                settings.SUPABASE_URL, 
                settings.SUPABASE_SERVICE_ROLE_KEY
            )
        return cls._client

supabase = SupabaseService.get_client()
