import os
import django
from supabase import create_client, Client
import dotenv
from pathlib import Path

# Load environment variables from .env file
BASE_DIR = Path(__file__).resolve().parent.parent
dotenv.load_dotenv(BASE_DIR / ".env")

# Supabase Configuration
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
if not SUPABASE_URL:
    SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
if not SUPABASE_KEY:
    SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase credentials not found in environment variables.")

def sync_roles():
    if __name__ == "__main__":
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'remotehive_admin.settings')
        django.setup()

    from core.taxonomy_models import JobRole

    print("Connecting to Supabase...")
    # Use service key if available, else anon key (might fail if RLS blocks writes)
    # Ideally we need the SERVICE_ROLE_KEY for writes. 
    # Checking environment variable or falling back to anon key (which might work if RLS allows anon writes for now)
    key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_KEY)
    
    # Fix potential key duplication issue seen in signals.py
    parts = key.split('.')
    if len(parts) > 3:
        key = ".".join(parts[:3])
    else:
        key = key.strip()

    supabase: Client = create_client(SUPABASE_URL, key)
    
    roles = JobRole.objects.all()
    print(f"Found {roles.count()} roles in Django. Syncing to Supabase...")

    count = 0
    errors = 0
    
    for role in roles:
        try:
            data = {
                'name': role.name,
                'slug': role.slug,
                # 'is_remote_friendly': role.is_remote_friendly, # Uncomment if column exists
            }
            
            # Upsert using slug as unique key
            # Note: Supabase upsert requires the column to be a primary key or have a unique constraint
            # We assume 'slug' or 'name' is unique.
            
            # First try to see if it exists to update, or just use upsert if configured
            # Using basic insert/update logic to be safe
            
            existing = supabase.table('job_roles').select('id').eq('slug', role.slug).execute()
            
            if existing.data:
                role_id = existing.data[0]['id']
                supabase.table('job_roles').update(data).eq('id', role_id).execute()
                print(f"Updated: {role.name}", end='\r')
            else:
                supabase.table('job_roles').insert(data).execute()
                print(f"Inserted: {role.name}", end='\r')
            
            count += 1
            
        except Exception as e:
            # If table doesn't exist, we'll hit this immediately
            print(f"\nError syncing {role.name}: {e}")
            errors += 1
            if "relation" in str(e) and "does not exist" in str(e):
                print("\nCRITICAL: 'job_roles' table does not exist in Supabase.")
                break

    print(f"\nSync complete. Success: {count}, Errors: {errors}")

if __name__ == "__main__":
    sync_roles()
