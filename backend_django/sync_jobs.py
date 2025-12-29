import os
import django
from supabase import create_client, Client
import dotenv
from pathlib import Path

# Load environment variables from .env file
BASE_DIR = Path(__file__).resolve().parent.parent
dotenv.load_dotenv(BASE_DIR / ".env")

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

def sync_supabase_jobs():
    if __name__ == "__main__":
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'remotehive_admin.settings')
        django.setup()

    from core.job_models import Job
    from django.contrib.auth import get_user_model
    from django.utils.text import slugify
    import uuid

    User = get_user_model()
    # Default to admin user for imported jobs if owner not found
    admin_user = User.objects.filter(is_superuser=True).first()
    
    print("Connecting to Supabase...")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    try:
        # Fetch jobs from Supabase
        # We also need company info, which is likely joined
        response = supabase.table('jobs').select('*, companies(*)').execute()
        jobs = response.data
        
        print(f"Found {len(jobs)} jobs in Supabase.")
        
        for job_data in jobs:
            title = job_data.get('title')
            if not title: continue
            
            # Generate or use existing slug
            slug = slugify(title)
            
            # Map Company Data
            company_data = job_data.get('companies') or {}
            company_name = company_data.get('name', 'Unknown Company')
            company_logo = company_data.get('logo_url')
            
            # Map Status
            status = 'published' if job_data.get('status') == 'active' else 'draft'
            
            # Check if job exists by slug (or some ID if we stored it)
            # Since we don't have a supabase_id field in Django yet, we'll try to match by title+company
            # Ideally we should add a supabase_id field to the Job model later
            
            job, created = Job.objects.update_or_create(
                slug=slug,
                defaults={
                    'title': title,
                    'company': company_name,
                    'company_logo': company_logo,
                    'location': job_data.get('location', 'Remote'),
                    'job_type': job_data.get('type', 'full_time').lower().replace('-', '_'),
                    'salary_range': job_data.get('salary_range'),
                    'description': job_data.get('description') or "No description provided.",
                    'requirements': job_data.get('requirements') or "",
                    'benefits': job_data.get('benefits') or "",
                    'apply_url': job_data.get('application_link'),
                    'status': status,
                    'posted_by': admin_user, # Defaulting to admin for now
                    'created_at': job_data.get('posted_at'),
                }
            )
            
            if created:
                print(f"Imported: {title}")
            else:
                print(f"Updated: {title}")

    except Exception as e:
        print(f"Error syncing jobs: {e}")

if __name__ == "__main__":
    sync_supabase_jobs()
