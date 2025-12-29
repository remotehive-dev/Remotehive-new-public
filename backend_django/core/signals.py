from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from .job_models import Job
from .models import APIConfiguration
from .taxonomy_models import JobRole
from autoscraper.models import ScraperSource
from django.utils.text import slugify
from supabase import create_client
import uuid

import os
import dotenv
from pathlib import Path

# Load environment variables from .env file
BASE_DIR = Path(__file__).resolve().parent.parent.parent
dotenv.load_dotenv(BASE_DIR / ".env")

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

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
            # New Fields Sync - Temporarily disabled due to Supabase schema mismatch
            # 'job_reference_id': instance.job_reference_id,
            # 'application_method': instance.application_method
        }
        
        # 3. Upsert Job
        # Try to match by slug first (unique in Supabase)
        existing = supabase.table('jobs').select('id').eq('slug', instance.slug).execute()
        
        if existing.data:
            # Update
            job_id = existing.data[0]['id']
            supabase.table('jobs').update(job_data).eq('id', job_id).execute()
            msg = f"Synced Update to Supabase: {instance.title}"
            print(msg)
            with open("sync_debug.log", "a") as f:
                f.write(f"\n[SUCCESS] {msg}\n")
        else:
            # Insert
            supabase.table('jobs').insert(job_data).execute()
            msg = f"Synced Insert to Supabase: {instance.title}"
            print(msg)
            with open("sync_debug.log", "a") as f:
                f.write(f"\n[SUCCESS] {msg}\n")
            
    except Exception as e:
        import traceback
        error_msg = f"Error syncing to Supabase: {e}\n{traceback.format_exc()}"
        print(error_msg)
        with open("sync_error.log", "a") as f:
            f.write(f"\n--- {instance.title} ---\n")
            f.write(error_msg)

@receiver(post_save, sender=APIConfiguration)
def sync_api_config_to_scraper_source(sender, instance, created, **kwargs):
    """
    Syncs APIConfiguration changes to ScraperSource.
    """
    try:
        # Determine default URL if not provided
        default_urls = {
            "rapidapi": "https://rapidapi.com/active-jobs-db",
            "linkedin": "https://rapidapi.com/linkedin-job-search-api",
            "serp": "https://serpapi.com/",
            "openwebninja": "https://api.openwebninja.com/jsearch"
        }
        
        target_url = instance.base_url
        if not target_url:
            target_url = default_urls.get(instance.service_name, "https://example.com")

        # Map service name to Scraper Source Name
        source_name = instance.get_service_name_display()
        
        # Update or Create ScraperSource
        # We assume 'name' is the unique identifier for ScraperSource
        ScraperSource.objects.update_or_create(
            name=source_name,
            defaults={
                'url': target_url,
                'is_active': instance.is_active,
                # 'last_scraped': None # Don't reset this on config update
            }
        )
        print(f"Synced API Config '{instance.service_name}' to ScraperSource '{source_name}'")
            
    except Exception as e:
        print(f"Error syncing API Config to ScraperSource: {e}")

@receiver(post_save, sender=JobRole)
def sync_job_role_to_supabase(sender, instance, created, **kwargs):
    """
    Syncs local Django JobRole changes to Supabase 'job_roles' table.
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
        
        role_data = {
            'name': instance.name,
            'slug': instance.slug,
            # 'is_remote_friendly': instance.is_remote_friendly,
            # 'seniority_level': instance.seniority_level,
            # 'typical_skills': instance.typical_skills,
            # 'employment_type': instance.employment_type
        }
        
        # Upsert by slug
        existing = supabase.table('job_roles').select('id').eq('slug', instance.slug).execute()
        
        if existing.data:
            role_id = existing.data[0]['id']
            supabase.table('job_roles').update(role_data).eq('id', role_id).execute()
            print(f"Synced JobRole Update to Supabase: {instance.name}")
        else:
            supabase.table('job_roles').insert(role_data).execute()
            print(f"Synced JobRole Insert to Supabase: {instance.name}")
            
    except Exception as e:
        print(f"Error syncing JobRole to Supabase: {e}")

@receiver(post_delete, sender=JobRole)
def delete_job_role_from_supabase(sender, instance, **kwargs):
    """
    Syncs local Django JobRole deletions to Supabase 'job_roles' table.
    """
    try:
        raw_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_ANON_KEY)
        parts = raw_key.split('.')
        if len(parts) > 3:
            key = ".".join(parts[:3])
        else:
            key = raw_key.strip()
            
        supabase = create_client(SUPABASE_URL, key)
        
        existing = supabase.table('job_roles').select('id').eq('slug', instance.slug).execute()
        
        if existing.data:
            role_id = existing.data[0]['id']
            supabase.table('job_roles').delete().eq('id', role_id).execute()
            print(f"Synced JobRole Deletion to Supabase: {instance.name}")
            
    except Exception as e:
        print(f"Error syncing JobRole deletion to Supabase: {e}")

