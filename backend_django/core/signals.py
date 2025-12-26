from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from .job_models import Job
from django.utils.text import slugify
from supabase import create_client
import uuid

import os
import dotenv
from pathlib import Path

# Load environment variables from .env file
BASE_DIR = Path(__file__).resolve().parent.parent.parent
dotenv.load_dotenv(BASE_DIR / ".env")

# Hardcoded for speed (fallback)
SUPABASE_URL = "https://kvpgsbnwzsqflkeihnyo.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2cGdzYm53enNxZmxrZWlobnlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MjEwMzAsImV4cCI6MjA4MTE5NzAzMH0.7CIYWM3mv_8miF5Oww5uActeNY-AhB07gLRb0X1tqjg"

@receiver(post_delete, sender=Job)
def delete_job_from_supabase(sender, instance, **kwargs):
    """
    Syncs local Django Job deletions to Supabase 'jobs' table.
    """
    try:
        # Prefer Service Key if available (bypasses RLS)
        raw_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_ANON_KEY)
        
        parts = raw_key.split('.')
        if len(parts) > 3:
            key = ".".join(parts[:3])
        else:
            key = raw_key.strip()
            
        supabase = create_client(SUPABASE_URL, key)
        
        # Try to find job by slug
        existing = supabase.table('jobs').select('id').eq('slug', instance.slug).execute()
        
        if existing.data:
            job_id = existing.data[0]['id']
            supabase.table('jobs').delete().eq('id', job_id).execute()
            print(f"Synced Deletion to Supabase: {instance.title}")
            
    except Exception as e:
        print(f"Error syncing deletion to Supabase: {e}")

@receiver(post_save, sender=Job)
def sync_job_to_supabase(sender, instance, created, **kwargs):
    """
    Syncs local Django Job changes to Supabase 'jobs' table.
    """
    try:
        # Prefer Service Key if available (bypasses RLS)
        raw_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_ANON_KEY)
        
        # FIX: Handle duplicated keys
        parts = raw_key.split('.')
        if len(parts) > 3:
            key = ".".join(parts[:3])
        else:
            key = raw_key.strip()
            
        supabase = create_client(SUPABASE_URL, key)
        
        # 1. Ensure Company Exists or Use Placeholder
        company_name = instance.company
        
        # Check if company exists
        res = supabase.table('companies').select('id').eq('name', company_name).execute()
        if res.data:
            company_id = res.data[0]['id']
        else:
            # Create dummy company for the job
            # Schema requires 'type' constraint: Corporate, MNC, Startup, Agency, Consultancy
            unique_slug = slugify(company_name) + '-' + str(uuid.uuid4())[:8]
            new_company = {
                'name': company_name,
                'logo_url': instance.company_logo,
                'slug': unique_slug,
                'type': 'Startup', # Default to satisfy constraint
                'description': f"Company profile for {company_name}",
                'website_url': 'https://remotehive.io' # Placeholder
            }
            res = supabase.table('companies').insert(new_company).execute()
            if res.data:
                company_id = res.data[0]['id']
            else:
                print(f"Failed to create company {company_name} in Supabase")
                return

        # 2. Map Job Data
        # Map workplace_type: remote, hybrid, onsite
        workplace_type = 'onsite'
        loc_lower = instance.location.lower()
        if 'remote' in loc_lower or 'anywhere' in loc_lower:
            workplace_type = 'remote'
        elif 'hybrid' in loc_lower:
            workplace_type = 'hybrid'

        # Map job type (ensure matches check constraint)
        j_type = instance.job_type.replace('_', '-') # full_time -> full-time
        if j_type not in ['full-time', 'part-time', 'contract', 'freelance', 'internship']:
            j_type = 'full-time' # Fallback

        job_data = {
            'title': instance.title,
            'slug': instance.slug, # Ensure slug is synced
            'location': instance.location,
            'type': j_type,
            'workplace_type': workplace_type,
            'salary_range': instance.salary_range,
            'description': instance.description,
            'requirements': [instance.requirements] if instance.requirements else [],
            'benefits': [instance.benefits] if instance.benefits else [],
            'company_id': company_id,
            'status': 'active' if instance.status == 'published' else 'draft',
            'application_url': instance.apply_url, # Changed from application_link to match schema
            # New Fields Sync
            'job_reference_id': instance.job_reference_id,
            'application_method': instance.application_method
        }
        
        # 3. Upsert Job
        # Try to match by slug first (unique in Supabase)
        existing = supabase.table('jobs').select('id').eq('slug', instance.slug).execute()
        
        if existing.data:
            # Update
            job_id = existing.data[0]['id']
            supabase.table('jobs').update(job_data).eq('id', job_id).execute()
            print(f"Synced Update to Supabase: {instance.title}")
        else:
            # Insert
            supabase.table('jobs').insert(job_data).execute()
            print(f"Synced Insert to Supabase: {instance.title}")
            
    except Exception as e:
        print(f"Error syncing to Supabase: {e}")
