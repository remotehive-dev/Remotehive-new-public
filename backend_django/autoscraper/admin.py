from django.contrib import admin
from django.contrib import messages
from django.utils.text import slugify
from django.utils.html import format_html
from django.urls import path
from django.shortcuts import redirect
import uuid
from core.job_models import Job
from django.utils import timezone
from django.db.models import Count
from .models import ScraperSource, ScrapedJob, TargetCompany, Company
from .services import fetch_rapid_jobs, fetch_serp_jobs, fetch_linkedin_jobs
from .views import scraper_stats_view
from .logo_service import LogoFetchService

# Company Admin with Logo Support
@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['logo_preview', 'name', 'domain', 'job_count', 'logo_last_fetched', 'logo_fetch_failed']
    search_fields = ['name', 'domain', 'website']
    list_filter = ['logo_fetch_failed', 'created_at']
    readonly_fields = ['logo_preview_large', 'created_at', 'updated_at', 'job_count']
    fieldsets = (
        ('Company Information', {
            'fields': ('name', 'domain', 'website', 'description')
        }),
        ('Logo', {
            'fields': ('logo_preview_large', 'logo_url', 'logo_last_fetched', 'logo_fetch_failed')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'job_count'),
            'classes': ('collapse',)
        }),
    )
    actions = ['refetch_logos', 'clear_failed_flag']
    
    def logo_preview(self, obj):
        """Small logo preview for list view"""
        if obj.logo_url:
            return format_html(
                '<img src="{}" width="30" height="30" style="object-fit: contain; border-radius: 4px;" />',
                obj.logo_url
            )
        return "❌"
    logo_preview.short_description = 'Logo'
    
    def logo_preview_large(self, obj):
        """Large logo preview for detail view"""
        if obj.logo_url:
            return format_html(
                '<img src="{}" width="100" height="100" style="object-fit: contain; border: 1px solid #ddd; padding: 10px; border-radius: 8px;" />',
                obj.logo_url
            )
        return "No logo available"
    logo_preview_large.short_description = 'Logo Preview'
    
    def job_count(self, obj):
        """Count of jobs for this company"""
        return obj.jobs.count()
    job_count.short_description = 'Jobs'
    
    def refetch_logos(self, request, queryset):
        """Admin action to refetch logos for selected companies"""
        logo_service = LogoFetchService()
        
        success_count = 0
        for company in queryset:
            # Clear failed flag to retry
            company.logo_fetch_failed = False
            company.save()
            
            if logo_service.fetch_logo_for_company(company):
                success_count += 1
        
        self.message_user(request, f'Successfully fetched {success_count}/{queryset.count()} logos.')
    refetch_logos.short_description = 'Refetch logos for selected companies'
    
    def clear_failed_flag(self, request, queryset):
        """Clear the logo_fetch_failed flag to allow retry"""
        count = queryset.update(logo_fetch_failed=False)
        self.message_user(request, f'Cleared failed flag for {count} companies.')
    clear_failed_flag.short_description = 'Clear "failed" flag'

@admin.register(TargetCompany)
class TargetCompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'website', 'logo_preview', 'region', 'is_active', 'last_scraped_at')
    list_filter = ('is_active', 'region')
    search_fields = ('name', 'website')
    actions = ['fetch_jobs_action', 'fetch_logos_action', 'sync_to_supabase_action']

    def logo_preview(self, obj):
        if obj.logo_url:
            return format_html('<img src="{}" style="height: 30px; max-width: 100px;" />', obj.logo_url)
        return "-"
    logo_preview.short_description = "Logo"

    def fetch_logos_action(self, request, queryset):
        import requests
        from urllib.parse import urlparse

        success_count = 0
        for company in queryset:
            if not company.website:
                continue

            try:
                # Extract domain
                domain = urlparse(company.website).netloc
                if not domain:
                    continue
                
                # Clean domain (remove www.)
                if domain.startswith("www."):
                    domain = domain[4:]
                
                logo_url = f"https://logo.clearbit.com/{domain}"
                
                # Verify if logo exists
                response = requests.head(logo_url, timeout=5)
                if response.status_code == 200:
                    company.logo_url = logo_url
                    company.save()
                    success_count += 1
            except Exception as e:
                print(f"Error fetching logo for {company.name}: {e}")
                continue
        
        self.message_user(request, f"Successfully fetched logos for {success_count} companies.")
    fetch_logos_action.short_description = "Fetch Logos for Selected Companies"

    def sync_to_supabase_action(self, request, queryset):
        from supabase import create_client
        from django.utils.text import slugify
        import uuid
        import os
        import dotenv
        from pathlib import Path

        # Load environment variables from .env file (ensure we have Service Role Key)
        BASE_DIR = Path(__file__).resolve().parent.parent.parent
        dotenv.load_dotenv(BASE_DIR / ".env")

        # Hardcoded for speed (fallback)
        SUPABASE_URL = "https://kvpgsbnwzsqflkeihnyo.supabase.co"
        SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2cGdzYm53enNxZmxrZWlobnlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MjEwMzAsImV4cCI6MjA4MTE5NzAzMH0.7CIYWM3mv_8miF5Oww5uActeNY-AhB07gLRb0X1tqjg"
        
        # Prefer Service Key if available
        raw_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_ANON_KEY)
        parts = raw_key.split('.')
        if len(parts) > 3:
            key = ".".join(parts[:3])
        else:
            key = raw_key.strip()
            
        supabase = create_client(SUPABASE_URL, key)
        
        success_count = 0
        updated_count = 0
        
        for company in queryset:
            try:
                # Check if exists
                res = supabase.table('companies').select('id').eq('name', company.name).execute()
                
                company_data = {
                    'name': company.name,
                    'website_url': company.website,
                    'logo_url': company.logo_url,
                    'location': company.region,
                    # We default to Startup if not known, or could try to infer
                    'type': 'Startup', 
                    'description': f"About {company.name}"
                }

                if res.data:
                    # Update
                    company_id = res.data[0]['id']
                    # Only update fields that are not null in our local data
                    update_data = {k: v for k, v in company_data.items() if v}
                    supabase.table('companies').update(update_data).eq('id', company_id).execute()
                    updated_count += 1
                else:
                    # Insert
                    unique_slug = slugify(company.name) + '-' + str(uuid.uuid4())[:8]
                    company_data['slug'] = unique_slug
                    supabase.table('companies').insert(company_data).execute()
                    success_count += 1
                    
            except Exception as e:
                print(f"Error syncing {company.name}: {e}")
                continue
                
        self.message_user(request, f"Synced to Supabase: {success_count} new, {updated_count} updated.")
    sync_to_supabase_action.short_description = "Sync Selected Companies to Supabase"

    def fetch_jobs_action(self, request, queryset):
        success_count = 0
        total_jobs = 0
        
        for company in queryset:
            # Use SERP API for company specific searches
            query = f"{company.name} remote jobs"
            count, error = fetch_serp_jobs(query=query)
            
            if error:
                # If SERP fails, maybe try RapidAPI with title? Unlikely to work for company.
                # Just log error.
                pass 
            else:
                total_jobs += count
                success_count += 1
                company.last_scraped_at = timezone.now()
                company.save()
        
        self.message_user(request, f"Triggered scrape for {queryset.count()} companies. Found {total_jobs} new jobs.")
    fetch_jobs_action.short_description = "Fetch Jobs for Selected Companies"

@admin.register(ScraperSource)
class ScraperSourceAdmin(admin.ModelAdmin):
    list_display = ('name', 'url', 'is_active', 'last_scraped', 'fetch_btn')
    list_filter = ('is_active',)
    actions = ['run_scraper']

    def fetch_btn(self, obj):
        return format_html(
            '<a class="button" href="fetch/{}/">Fetch Jobs</a>',
            obj.id
        )
    fetch_btn.short_description = "Actions"
    fetch_btn.allow_tags = True

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('fetch/<int:pk>/', self.admin_site.admin_view(self.fetch_view), name='source-fetch-jobs'),
        ]
        return custom_urls + urls

    def fetch_view(self, request, pk):
        from django.shortcuts import get_object_or_404
        source = get_object_or_404(ScraperSource, pk=pk)
        
        count = 0
        error = None
        
        if "RapidAPI" in source.name:
            count, error = fetch_rapid_jobs()
        elif "SERP" in source.name:
            count, error = fetch_serp_jobs()
        elif "LinkedIn" in source.name:
            count, error = fetch_linkedin_jobs()
        else:
            # Fallback: Try both if name is generic
            c1, e1 = fetch_rapid_jobs()
            c2, e2 = fetch_serp_jobs()
            c3, e3 = fetch_linkedin_jobs()
            count = c1 + c2 + c3
            errors = [e for e in [e1, e2, e3] if e]
            if errors: error = " | ".join(errors)
            
        if error:
            self.message_user(request, f"Error fetching {source.name}: {error}", level=messages.ERROR)
        else:
            self.message_user(request, f"Fetched {count} jobs from {source.name}.", level=messages.SUCCESS)
            
        return redirect('admin:autoscraper_scrapersource_changelist')

    def run_scraper(self, request, queryset):
        success_count = 0
        for source in queryset:
            count = 0
            error = None
            
            if "RapidAPI" in source.name:
                count, error = fetch_rapid_jobs()
            elif "SERP" in source.name:
                count, error = fetch_serp_jobs()
            elif "LinkedIn" in source.name:
                count, error = fetch_linkedin_jobs()
            else:
                self.message_user(request, f"No scraper logic defined for {source.name}", level=messages.WARNING)
                continue
                
            if error:
                self.message_user(request, f"Error fetching {source.name}: {error}", level=messages.ERROR)
            else:
                self.message_user(request, f"Fetched {count} jobs from {source.name}.")
                success_count += 1
                
        if success_count > 0:
            self.message_user(request, "Scraping completed successfully.")
            
    run_scraper.short_description = "Fetch Jobs from Selected Source"

@admin.register(ScrapedJob)
class ScrapedJobAdmin(admin.ModelAdmin):
    change_list_template = "admin/scrapedjob_changelist.html"
    list_display = ['company_with_logo', 'title', 'location', 'is_remote', 'posted_date', 'status_badge', 'source']
    list_filter = ['status', 'is_remote', 'source', 'posted_date', 'created_at']
    search_fields = ['title', 'company_text', 'location', 'description']
    readonly_fields = ['created_at', 'updated_at']
    actions = ['approve_jobs', 'reject_jobs']
    
    def company_with_logo(self, obj):
        """Display company name with logo"""
        if obj.company and obj.company.logo_url:
            return format_html(
                '<div style="display: flex; align-items: center; gap: 8px;">'
                '<img src="{}" width="24" height="24" style="object-fit: contain; border-radius: 4px;" />'
                '<span>{}</span>'
                '</div>',
                obj.company.logo_url,
                obj.company.name
            )
        elif obj.company:
            return format_html('<span>{}</span>', obj.company.name)
        return obj.company_text or "Unknown"
    company_with_logo.short_description = 'Company'
    company_with_logo.admin_order_field = 'company__name'
    
    date_hierarchy = 'posted_date'
    
    fieldsets = (
        ('Job Details', {
            'fields': ('title', 'company', 'location', 'description', 'url')
        }),
        ('Metadata', {
            'fields': ('source', 'posted_date', 'is_remote', 'salary_range', 'job_type')
        }),
        ('Management', {
            'fields': ('status', 'created_at', 'updated_at')
        }),
    )
    
    actions = ['approve_jobs', 'reject_jobs']

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('fetch-all/', self.admin_site.admin_view(self.fetch_all_view), name='fetch-all-jobs'),
            path('stats/', self.admin_site.admin_view(scraper_stats_view), name='scraper-stats'),
        ]
        return custom_urls + urls

    def fetch_all_view(self, request):
        c1, e1 = fetch_rapid_jobs()
        c2, e2 = fetch_serp_jobs()
        c3, e3 = fetch_linkedin_jobs()
        
        total = c1 + c2 + c3
        messages_list = []
        if e1: messages_list.append(f"RapidAPI: {e1}")
        if e2: messages_list.append(f"SERP API: {e2}")
        if e3: messages_list.append(f"LinkedIn API: {e3}")
        
        if messages_list:
            self.message_user(request, "Errors: " + " | ".join(messages_list), level=messages.WARNING)
        
        self.message_user(request, f"Fetched {total} new jobs from all active sources.", level=messages.SUCCESS)
        return redirect('admin:autoscraper_scrapedjob_changelist')

    def approve_jobs(self, request, queryset):
        published_count = 0
        for scraped_job in queryset:
            if scraped_job.status == 'approved':
                continue # Already approved
            
            # Create Core Job
            slug_base = slugify(scraped_job.title)
            unique_slug = f"{slug_base}-{str(uuid.uuid4())[:8]}"
            
            # Map Job Type
            job_type = 'full_time'
            raw_type = str(scraped_job.job_type).lower()
            if 'part' in raw_type: job_type = 'part_time'
            elif 'contract' in raw_type: job_type = 'contract'
            elif 'intern' in raw_type: job_type = 'internship'
            
            Job.objects.create(
                title=scraped_job.title,
                slug=unique_slug,
                company=scraped_job.company,
                location=scraped_job.location,
                description=scraped_job.description,
                job_type=job_type,
                salary_range=scraped_job.salary_range,
                apply_url=scraped_job.url,
                status='published',
                posted_by=request.user
            )
            
            scraped_job.status = 'approved'
            scraped_job.save()
            published_count += 1
            
        self.message_user(request, f"{published_count} jobs approved and published to the main board.")
    approve_jobs.short_description = "Approve and Publish Selected Jobs"

    def reject_jobs(self, request, queryset):
        queryset.update(status='rejected')
        self.message_user(request, "Selected jobs have been rejected.")
    reject_jobs.short_description = "Reject selected jobs"
