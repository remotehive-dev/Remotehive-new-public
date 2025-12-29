from django.contrib import admin
from django.contrib import messages
from django.utils.text import slugify
from django.utils.html import format_html
from django.urls import path
from django.shortcuts import redirect
import uuid
from core.job_models import Job
from django.utils import timezone
from django.db import models
from django.db.models import Count
from .models import Company, CompanyCategory, TargetCompany, ScheduledTask, ScraperLog, ScraperSource, ScrapedJob, Country
from core.taxonomy_models import JobRole
from .services import fetch_rapid_jobs, fetch_serp_jobs, fetch_linkedin_jobs, fetch_openwebninja_jobs, fetch_adzuna_jobs
from .views import scraper_stats_view
from .logo_service import LogoFetchService
from django.http import JsonResponse
import threading

@admin.register(CompanyCategory)
class CompanyCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent', 'is_active', 'order')
    list_filter = ('is_active',)
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('order', 'name')

@admin.register(ScheduledTask)
class ScheduledTaskAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'interval_minutes', 'last_run_at', 'run_now_btn')
    list_filter = ('is_active',)
    filter_horizontal = ('target_companies',)
    actions = ['activate_tasks', 'deactivate_tasks']
    
    change_form_template = "admin/autoscraper/scheduledtask/change_form.html"

    def run_now_btn(self, obj):
        if obj.name == 'scrape_companies':
             return format_html(
                '<a class="button" href="control/{}/" style="background-color: #28a745; color: white;">Open Control Panel</a>',
                obj.id
            )
        return format_html(
            '<a class="button" href="run/{}/">Run Once</a>',
            obj.id
        )
    run_now_btn.short_description = "Actions"
    run_now_btn.allow_tags = True

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('run/<int:pk>/', self.admin_site.admin_view(self.run_now_view), name='scheduled-task-run'),
            path('control/<int:pk>/', self.admin_site.admin_view(self.control_panel_view), name='scraper-control-panel'),
            path('control/<int:pk>/start/', self.admin_site.admin_view(self.start_scraper_api), name='scraper-start-api'),
            path('control/<int:pk>/status/', self.admin_site.admin_view(self.status_scraper_api), name='scraper-status-api'),
            path('control/<int:pk>/stop/', self.admin_site.admin_view(self.stop_scraper_api), name='scraper-stop-api'),
        ]
        return custom_urls + urls

    def control_panel_view(self, request, pk):
        from django.shortcuts import render, get_object_or_404
        from autoscraper.models import CompanyScrapeProfile
        task = get_object_or_404(ScheduledTask, pk=pk)
        
        # Get latest log
        latest_log = task.logs.first()
        
        context = {
            'title': f"Scraper Control: {task.get_name_display()}",
            'task': task,
            'latest_log': latest_log,
            'opts': self.model._meta,
            'has_change_permission': self.has_change_permission(request, task),
            'discovery_strategies': CompanyScrapeProfile.DISCOVERY_STRATEGIES,
        }
        return render(request, "admin/autoscraper/scheduledtask/scraper_control.html", context)

    def start_scraper_api(self, request, pk):
        """API to trigger the scraper in a background thread"""
        import json
        task = ScheduledTask.objects.get(pk=pk)
        
        # Parse Request Body for strategies and api_configs
        strategies = []
        api_configs = []
        advanced_filters = {}
        try:
            if request.method == 'POST':
                data = json.loads(request.body)
                strategies = data.get('strategies', [])
                api_configs = data.get('api_configs', [])
                advanced_filters = data.get('advanced_filters', {})
        except:
            pass

        # Create Log
        log = ScraperLog.objects.create(
            task=task,
            status='running',
            total_companies_target=task.target_companies.count(),
            message=f"Initializing scraper engine with strategies: {strategies}, Filters: {bool(advanced_filters)}" if strategies else "Initializing scraper engine..."
        )
        
        # Run in Thread
        thread = threading.Thread(target=self._run_scraper_thread, args=(task.id, log.id, strategies, api_configs, advanced_filters))
        thread.daemon = True
        thread.start()
        
        return JsonResponse({'status': 'started', 'log_id': log.id})

    def stop_scraper_api(self, request, pk):
        task = ScheduledTask.objects.get(pk=pk)
        # We can't easily kill a thread, but we can update the log status to 'stopped'
        # and the thread loop should check this DB status.
        log = task.logs.filter(status='running').first()
        if log:
            log.status = 'stopped'
            log.message += " [Stop Requested]"
            log.save()
            return JsonResponse({'status': 'stopping'})
        return JsonResponse({'status': 'no_running_task'})

    def status_scraper_api(self, request, pk):
        task = ScheduledTask.objects.get(pk=pk)
        log = task.logs.first() # Latest log
        
        if not log:
            return JsonResponse({'status': 'idle'})
            
        return JsonResponse({
            'status': log.status,
            'progress': log.progress_percentage(),
            'processed': log.companies_processed,
            'total': log.total_companies_target,
            'jobs_found': log.jobs_found,
            'current_company': log.current_company,
            'message': log.message
        })

    def _run_scraper_thread(self, task_id, log_id, strategies=None, api_configs=None, advanced_filters=None):
        """The actual scraping logic running in background"""
        import time
        try:
            task = ScheduledTask.objects.get(id=task_id)
            log = ScraperLog.objects.get(id=log_id)
            
            if task.name == 'enrich_companies':
                self._run_enrichment_logic(task, log)
            else:
                self._run_job_scraper_logic(task, log, strategies, api_configs, advanced_filters)
                
        except Exception as e:
            print(f"Scraper Thread Error: {e}")
            try:
                log = ScraperLog.objects.get(id=log_id)
                log.status = 'failed'
                log.message = str(e)
                log.save()
            except:
                pass

    def _run_enrichment_logic(self, task, log):
        """Logic for enriching company profiles"""
        import time
        from .logo_service import LogoFetchService
        
        service = LogoFetchService()
        
        # Determine targets
        # If task has specific targets, use them. Otherwise, target all companies with missing data.
        if task.target_companies.exists():
            companies = task.target_companies.all()
        else:
            # Target companies created recently or with missing critical data
            # For this "scraper", let's target companies that have no industry or employee count
            companies = Company.objects.filter(
                models.Q(industry__isnull=True) | 
                models.Q(employee_count__isnull=True) |
                models.Q(description__isnull=True)
            ).order_by('-created_at')[:500] # Limit batch size
            
        log.total_companies_target = companies.count()
        log.save()
        
        success_count = 0
        
        for company in companies:
            # CHECK STOP SIGNAL
            log.refresh_from_db()
            if log.status == 'stopped':
                break
            
            log.current_company = company.name
            log.save()
            
            # Enrich
            try:
                if service.enrich_company_details(company):
                    success_count += 1
            except Exception as e:
                print(f"Enrichment error for {company.name}: {e}")
            
            log.companies_processed += 1
            # We can misuse jobs_found to track success count for now, or add a new field
            log.jobs_found = success_count 
            log.save()
            
            # Polite Delay
            time.sleep(1)
            
        # Finalize
        log.refresh_from_db()
        if log.status != 'stopped':
            log.status = 'completed'
            log.current_company = "Done"
            log.end_time = timezone.now()
            log.message = f"Enriched {success_count} companies."
            log.save()
            
            task.last_run_at = timezone.now()
            task.save()

    def _run_job_scraper_logic(self, task, log, strategies=None, api_configs=None, advanced_filters=None):
        """Logic for scraping jobs (Indigenous Scraper via Engine)"""
        import time
        from autoscraper.indigenous_scraper import IndigenousScraperEngine
        
        # Determine Companies to Target
        if advanced_filters and advanced_filters.get('companies'):
            comp_ids = advanced_filters.get('companies')
            if 'all' in comp_ids:
                companies = task.target_companies.all()
            else:
                companies = task.target_companies.filter(id__in=comp_ids)
        else:
            companies = task.target_companies.all()
            
        # Determine Roles to Target
        target_roles = list(task.target_job_roles.all())
        
        # If no specific roles selected, use all defined job roles to ensure strictness
        # UNLESS advanced filters are provided, in which case we might rely on those
        if not target_roles and not advanced_filters:
            target_roles = list(JobRole.objects.all())
        
        # Determine Page Limit
        limit = 10 # Default
        if advanced_filters and advanced_filters.get('page_limit'):
            try:
                # We usually crawl 10 results per page, so 'page_limit' * 10
                limit = int(advanced_filters.get('page_limit')) * 10
            except:
                pass
        
        engine = IndigenousScraperEngine()
        
        for company in companies:
            # CHECK STOP SIGNAL
            log.refresh_from_db()
            if log.status == 'stopped':
                break
            
            log.current_company = company.name
            log.save()
            
            # EXECUTE ENGINE
            try:
                jobs_found, errors = engine.run(
                    company.id, 
                    job_roles=target_roles, 
                    limit=limit,
                    strategies=strategies,
                    api_configs=api_configs,
                    advanced_filters=advanced_filters
                )
                
                if errors:
                    for err in errors:
                        print(f"Error scraping {company.name}: {err}")
                        log.message = f"Error: {err}"[:200]
                        log.save()
                
                if jobs_found > 0:
                    log.message = f"Found {jobs_found} jobs for {company.name}"
                    log.jobs_found += jobs_found
                else:
                    log.message = f"No jobs found for {company.name}"
                    
            except Exception as e:
                print(f"Engine Crash for {company.name}: {e}")
                log.message = f"Crash: {e}"
                log.save()
            
            log.companies_processed += 1
            log.save()
            
            # Polite Delay between companies
            time.sleep(2) 
        
        # Finalize
        log.refresh_from_db()
        if log.status != 'stopped':
            log.status = 'completed'
            log.current_company = "Done"
            log.end_time = timezone.now()
            log.save()
            
            task.last_run_at = timezone.now()
            task.save()

    def run_now_view(self, request, pk):
        from django.core.management import call_command
        from django.utils import timezone
        
        task = self.get_object(request, pk)
        if not task:
            self.message_user(request, "Task not found", level=messages.ERROR)
            return redirect('admin:autoscraper_scheduledtask_changelist')
            
        try:
            # Execute logic based on task name
            if task.name == 'enrich_jobs':
                call_command('enrich_jobs')
                
            task.last_run_at = timezone.now()
            task.save()
            self.message_user(request, f"Successfully ran {task.get_name_display()}", level=messages.SUCCESS)
        except Exception as e:
            self.message_user(request, f"Error running task: {e}", level=messages.ERROR)
            
        return redirect('admin:autoscraper_scheduledtask_changelist')

    def activate_tasks(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, "Selected tasks have been activated.")
    activate_tasks.short_description = "Activate selected tasks"
    
    def deactivate_tasks(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, "Selected tasks have been deactivated.")
    deactivate_tasks.short_description = "Deactivate selected tasks"

# Custom Filters for Company Admin
class CompanyRegionFilter(admin.SimpleListFilter):
    title = 'Region (via Jobs)'
    parameter_name = 'job_region'

    def lookups(self, request, model_admin):
        # Return unique regions from ScrapedJob
        # Limiting to top 20 to avoid huge lists
        regions = ScrapedJob.objects.exclude(location__isnull=True).exclude(location='').values_list('location', flat=True).distinct()[:20]
        return [(r, r) for r in regions]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(jobs__location__icontains=self.value()).distinct()
        return queryset

class CompanyJobRoleFilter(admin.SimpleListFilter):
    title = 'Job Role (Taxonomy)'
    parameter_name = 'job_role'

    def lookups(self, request, model_admin):
        # Use actual JobRole names that are present in ScrapedJobs
        from core.taxonomy_models import JobRole
        # Get IDs of roles that are used in scraped jobs
        role_ids = ScrapedJob.objects.exclude(job_role__isnull=True).values_list('job_role', flat=True).distinct()
        roles = JobRole.objects.filter(id__in=role_ids).order_by('name')
        return [(r.id, r.name) for r in roles]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(jobs__job_role__id=self.value()).distinct()
        return queryset

class CompanySalaryFilter(admin.SimpleListFilter):
    title = 'Salary Available'
    parameter_name = 'has_salary'

    def lookups(self, request, model_admin):
        return [
            ('yes', 'Has Salary Info'),
            ('no', 'No Salary Info'),
        ]

    def queryset(self, request, queryset):
        if self.value() == 'yes':
            return queryset.exclude(jobs__salary_range__isnull=True).exclude(jobs__salary_range='').distinct()
        if self.value() == 'no':
            return queryset.filter(jobs__salary_range__isnull=True).distinct()
        return queryset

class CompanyExperienceFilter(admin.SimpleListFilter):
    title = 'Experience Level (Inferred)'
    parameter_name = 'experience'
    
    def lookups(self, request, model_admin):
        return [
            ('senior', 'Senior / Lead'),
            ('junior', 'Junior / Entry'),
            ('mid', 'Mid-Level'),
        ]
        
    def queryset(self, request, queryset):
        if self.value() == 'senior':
            return queryset.filter(jobs__title__iregex=r'senior|lead|principal|head').distinct()
        if self.value() == 'junior':
            return queryset.filter(jobs__title__iregex=r'junior|entry|intern').distinct()
        if self.value() == 'mid':
            # This is harder to filter strictly, but we can exclude senior/junior
            return queryset.exclude(jobs__title__iregex=r'senior|lead|principal|head|junior|entry|intern').distinct()
        return queryset


# Country Admin
@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'flag_emoji', 'is_active']
    search_fields = ['name', 'code']
    list_filter = ['is_active']

# Company Admin with Logo Support
@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    change_list_template = "admin/autoscraper/company/change_list.html"
    list_display = ['logo_preview', 'name', 'country', 'domain', 'job_count_badge', 'visual_stats', 'logo_last_fetched']
    search_fields = ['name', 'domain', 'website', 'country__name']
    list_filter = ['logo_fetch_failed', 'country', 'created_at', CompanyRegionFilter, CompanyJobRoleFilter, CompanySalaryFilter, CompanyExperienceFilter]
    readonly_fields = ['logo_preview_large', 'created_at', 'updated_at', 'job_count']
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        qs = qs.annotate(
            _job_count=Count('jobs'),
            _new_jobs=Count('jobs', filter=models.Q(jobs__status='new')),
            _approved_jobs=Count('jobs', filter=models.Q(jobs__status='approved'))
        )
        return qs

    def job_count_badge(self, obj):
        count = getattr(obj, '_job_count', 0)
        color = '#6c757d'
        if count > 0: color = '#28a745'
        if count > 10: color = '#007bff'
        if count > 50: color = '#6610f2'
        
        # Duplicate warning
        warning = ""
        # Check if company name appears multiple times
        is_duplicate = Company.objects.filter(name__iexact=obj.name).count() > 1
        if is_duplicate:
            warning = '<i class="fas fa-exclamation-triangle" style="color: #ffc107; margin-left: 5px;" title="Duplicate Company Name Detected"></i>'
        
        from django.utils.safestring import mark_safe
        
        return format_html(
            '<div style="text-align: center;">'
            '<span style="background-color: {}; color: white; padding: 5px 12px; border-radius: 20px; font-weight: bold; font-size: 14px;">{}</span>'
            '{}'
            '</div>',
            color, count, mark_safe(warning)
        )
    job_count_badge.short_description = "Total Jobs"
    job_count_badge.admin_order_field = '_job_count'
    
    def visual_stats(self, obj):
        """Mini bar chart or text stats"""
        new = getattr(obj, '_new_jobs', 0)
        approved = getattr(obj, '_approved_jobs', 0)
        
        return format_html(
            '<div style="font-size: 12px;">'
            '<span style="color: #007bff;">New: <b>{}</b></span> &nbsp;|&nbsp; '
            '<span style="color: #28a745;">Approved: <b>{}</b></span>'
            '</div>',
            new, approved
        )
    visual_stats.short_description = "Status Breakdown"

    def changelist_view(self, request, extra_context=None):
        # Aggregate Global Stats for the Dashboard
        from django.db.models import Count
        from core.taxonomy_models import JobRole
        from .models import ScheduledTask, CompanyScrapeProfile
        from core.models import APIConfiguration
        
        # 1. Total Stats
        total_companies = Company.objects.count()
        total_jobs = ScrapedJob.objects.count()
        
        # 2. Top Regions (by Company Country)
        top_regions_qs = ScrapedJob.objects.values(
            'company__country__name', 
            'company__country__flag_emoji'
        ).annotate(count=Count('id')).order_by('-count')[:5]
        
        top_regions = []
        for item in top_regions_qs:
            name = item['company__country__name']
            emoji = item['company__country__flag_emoji']
            count = item['count']
            
            if name:
                label = f"{emoji} {name}" if emoji else name
            else:
                label = "Unknown / International"
                
            top_regions.append({'location': label, 'count': count})
        
        # 3. Top Roles (Dynamic from Taxonomy)
        # Get top 8 used roles
        top_role_ids = ScrapedJob.objects.exclude(job_role__isnull=True).values('job_role').annotate(count=Count('id')).order_by('-count')[:8]
        roles_stats = {}
        
        for item in top_role_ids:
            try:
                role = JobRole.objects.get(id=item['job_role'])
                roles_stats[role.name] = item['count']
            except JobRole.DoesNotExist:
                pass
                
        # Fallback if no categorized jobs yet
        if not roles_stats:
             # Dynamically fetch stats for all job roles based on title keywords
             all_roles = JobRole.objects.all()
             temp_stats = []
             
             for role in all_roles:
                 count = ScrapedJob.objects.filter(title__icontains=role.name).count()
                 if count > 0:
                     temp_stats.append({'name': role.name, 'count': count})
             
             # Sort by count descending and take top 8
             temp_stats.sort(key=lambda x: x['count'], reverse=True)
             
             roles_stats = {item['name']: item['count'] for item in temp_stats[:8]}
             
             # If still empty (no matches), fallback to generic
             if not roles_stats:
                 roles_stats = {
                    'Engineer': ScrapedJob.objects.filter(title__icontains='engineer').count(),
                    'Developer': ScrapedJob.objects.filter(title__icontains='developer').count(),
                    'Manager': ScrapedJob.objects.filter(title__icontains='manager').count(),
                    'Analyst': ScrapedJob.objects.filter(title__icontains='analyst').count(),
                }
        
        # 4. Scraper Engine Context
        scraper_task, _ = ScheduledTask.objects.get_or_create(name='scrape_companies', defaults={'interval_minutes': 60, 'is_active': False})
        latest_log = scraper_task.logs.first()
        
        # 5. Company Enrichment Context
        enrich_task, _ = ScheduledTask.objects.get_or_create(name='enrich_companies', defaults={'interval_minutes': 1440, 'is_active': False})
        enrich_log = enrich_task.logs.first()
        
        # Get all roles for the dropdown
        all_job_roles = JobRole.objects.all().order_by('name')
        
        # API Configs and Strategies
        api_configs = APIConfiguration.objects.filter(is_active=True)
        
        # Countries for Sentence Builder
        all_countries = Country.objects.filter(is_active=True).order_by('name')
        
        # All Companies for Sentence Builder (limited for performance, maybe just active ones?)
        # Or better, we just use the ones already in the scraper target list?
        # User requested "Selected companies" logic.
        # Let's provide all companies for now, but maybe we should use an autocomplete?
        # For simplicity in this step, let's just pass all companies (might be heavy if 1000+)
        # Optimizing: only pass ID and Name.
        all_companies = Company.objects.all().values('id', 'name').order_by('name')
        
        extra_context = extra_context or {}
        extra_context['dashboard_stats'] = {
            'total_companies': total_companies,
            'total_jobs': total_jobs,
            'top_regions': top_regions,
            'roles_stats': roles_stats,
        }
        extra_context['scraper_task'] = scraper_task
        extra_context['scraper_log'] = latest_log
        extra_context['enrich_task'] = enrich_task
        extra_context['enrich_log'] = enrich_log
        extra_context['all_job_roles'] = all_job_roles
        extra_context['all_countries'] = all_countries
        extra_context['all_companies'] = all_companies
        extra_context['discovery_strategies'] = CompanyScrapeProfile.DISCOVERY_STRATEGIES
        extra_context['api_configs'] = api_configs
        
        return super().changelist_view(request, extra_context=extra_context)
    
    actions = ['fetch_jobs_action', 'add_to_scraper_targets', 'remove_from_scraper_targets', 'enrich_company_details_action', 'clear_failed_flag']
    
    def add_to_scraper_targets(self, request, queryset):
        """Add selected companies to the scheduled scraper"""
        task, _ = ScheduledTask.objects.get_or_create(name='scrape_companies')
        task.target_companies.add(*queryset)
        self.message_user(request, f"Added {queryset.count()} companies to the Scraper Engine configuration.")
    add_to_scraper_targets.short_description = "Add to Scraper Engine Targets"

    def remove_from_scraper_targets(self, request, queryset):
        """Remove selected companies from the scheduled scraper"""
        task, _ = ScheduledTask.objects.get_or_create(name='scrape_companies')
        task.target_companies.remove(*queryset)
        self.message_user(request, f"Removed {queryset.count()} companies from the Scraper Engine configuration.")
    remove_from_scraper_targets.short_description = "Remove from Scraper Engine Targets"
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('update-interval/', self.admin_site.admin_view(self.update_interval_view), name='update-scraper-interval'),
        ]
        return custom_urls + urls

    def update_interval_view(self, request):
        if request.method == 'POST':
            task, _ = ScheduledTask.objects.get_or_create(name='scrape_companies')
            
            # Update Interval
            interval = request.POST.get('interval')
            if interval:
                task.interval_minutes = int(interval)
                messages.success(request, f"Scraper interval updated to {interval} minutes.")
            
            # Update Job Roles
            role_ids = request.POST.getlist('job_roles')
            if role_ids:
                if 'all' in role_ids:
                    task.target_job_roles.clear()
                    messages.success(request, "Targeting ALL job roles.")
                else:
                    task.target_job_roles.set(role_ids)
                    messages.success(request, f"Targeting {len(role_ids)} specific job roles.")
            else:
                # If nothing selected, maybe clear? Or keep existing?
                # Usually empty multiselect means clear.
                # But here 'all' logic might apply. Let's assume empty list in POST means clear specific roles -> revert to all?
                # Actually, the user wants "select all at once option".
                # If the user sends an empty list, it usually means "All" in this context if we treat "No specific roles" as "All".
                # Let's check if the field was even in the form submission.
                if 'job_roles_present' in request.POST:
                     task.target_job_roles.clear()
                     messages.success(request, "Filters cleared. Targeting ALL job roles.")
            
            task.save()
            
        return redirect('admin:autoscraper_company_changelist')

    def fetch_jobs_action(self, request, queryset):
        success_count = 0
        total_jobs = 0
        
        for company in queryset:
            # Construct query: "Company Name jobs"
            # We use the OpenWebNinja API to find jobs specifically for this company
            q = f"{company.name} jobs"
            
            # Pass empty location so it doesn't default to "Chicago"
            count, error = fetch_openwebninja_jobs(query=q, location="")
            
            if not error:
                total_jobs += count
                success_count += 1
        
        self.message_user(request, f"Scrape triggered for {queryset.count()} companies. Found {total_jobs} new jobs via OpenWebNinja.")
    fetch_jobs_action.short_description = "Fetch Active Jobs for Selected Companies"

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
    
    def enrich_company_details_action(self, request, queryset):
        """Admin action to enrich company details (logo, social, etc.)"""
        logo_service = LogoFetchService()
        
        success_count = 0
        for company in queryset:
            # Clear failed flag to retry
            company.logo_fetch_failed = False
            company.save()
            
            if logo_service.enrich_company_details(company):
                success_count += 1
        
        self.message_user(request, f'Successfully enriched {success_count}/{queryset.count()} companies.')
    enrich_company_details_action.short_description = 'Enrich Details (Logo, Social, etc.)'
    
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
        elif "OpenWebNinja" in source.name:
            count, error = fetch_openwebninja_jobs()
        elif "Adzuna" in source.name:
            count, error = fetch_adzuna_jobs()
        else:
            # Fallback: Try both if name is generic
            c1, e1 = fetch_rapid_jobs()
            c2, e2 = fetch_serp_jobs()
            c3, e3 = fetch_linkedin_jobs()
            c4, e4 = fetch_openwebninja_jobs()
            c5, e5 = fetch_adzuna_jobs()
            count = c1 + c2 + c3 + c4 + c5
            errors = [e for e in [e1, e2, e3, e4, e5] if e]
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
            elif "OpenWebNinja" in source.name:
                count, error = fetch_openwebninja_jobs()
            elif "Adzuna" in source.name:
                count, error = fetch_adzuna_jobs()
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
    list_display = ['company_with_logo', 'title', 'job_role_display', 'location', 'salary_range', 'posted_date', 'status_badge']
    list_filter = ['status', 'is_remote', 'job_role__category__family', 'job_role__category', 'job_role', 'source', 'posted_date', 'job_type']
    search_fields = ['title', 'company_text', 'location', 'description', 'salary_range']
    readonly_fields = ['created_at', 'updated_at']
    list_per_page = 20
    list_max_show_all = 100
    actions = ['approve_jobs', 'reject_jobs', 'force_enrich_jobs', 'auto_categorize_jobs']

    def job_role_display(self, obj):
        if obj.job_role:
            return obj.job_role.name
        return "-"
    job_role_display.short_description = "Job Role"
    job_role_display.admin_order_field = 'job_role__name'

    def auto_categorize_jobs(self, request, queryset):
        """Action to auto-categorize selected jobs based on title"""
        from core.taxonomy_models import JobRole
        count = 0
        
        # Pre-fetch roles to avoid hitting DB in loop?
        # Actually, let's just do a simple query for each for now, or fetch all names.
        # There are ~100 roles.
        all_roles = list(JobRole.objects.all())
        
        for job in queryset:
            if job.job_role: continue # Skip if already set
            
            # Simple keyword matching
            matched_role = None
            title_lower = job.title.lower()
            
            # Sort roles by length (desc) to match specific "Senior Backend Developer" before "Developer"
            all_roles.sort(key=lambda r: len(r.name), reverse=True)
            
            for role in all_roles:
                if role.name.lower() in title_lower:
                    matched_role = role
                    break
            
            if matched_role:
                job.job_role = matched_role
                job.save()
                count += 1
                
        self.message_user(request, f"Auto-categorized {count} jobs.")
    auto_categorize_jobs.short_description = "Auto-Categorize Selected Jobs"

    def force_enrich_jobs(self, request, queryset):
        """Force enrichment of selected jobs (even if already approved)"""
        count = 0
        from .content_extractor import extract_job_details
        
        for job in queryset:
            details = extract_job_details(job.url)
            
            updated = False
            if details.get('description') and not details.get('error'):
                job.description = details['description']
                updated = True
            
            if details.get('salary_range'):
                job.salary_range = details['salary_range']
                updated = True
                
            if details.get('job_type'):
                job.job_type = details['job_type']
                updated = True
            
            # Update company logo if found and missing
            if details.get('company_logo') and job.company:
                if not job.company.logo_url:
                    job.company.logo_url = details['company_logo']
                    job.company.save()
            
            if updated:
                job.save()
                count += 1
                
        self.message_user(request, f"Successfully enriched {count} jobs with new Logic Engine.")
    force_enrich_jobs.short_description = "Force Enrich Selected Jobs (Selenium)"

    
    def description_preview(self, obj):
        if not obj.description:
            return "-"
        if len(obj.description) > 100:
            return format_html('<span title="{}">{}...</span>', obj.description, obj.description[:100])
        return obj.description
    description_preview.short_description = "Description"

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
        c4, e4 = fetch_openwebninja_jobs()
        c5, e5 = fetch_adzuna_jobs()
        
        total = c1 + c2 + c3 + c4 + c5
        messages_list = []
        if e1: messages_list.append(f"RapidAPI: {e1}")
        if e2: messages_list.append(f"SERP API: {e2}")
        if e3: messages_list.append(f"LinkedIn API: {e3}")
        if e4: messages_list.append(f"OpenWebNinja: {e4}")
        if e5: messages_list.append(f"Adzuna: {e5}")
        
        if messages_list:
            self.message_user(request, "Errors: " + " | ".join(messages_list), level=messages.WARNING)
        
        self.message_user(request, f"Fetched {total} new jobs from all active sources.", level=messages.SUCCESS)
        return redirect('admin:autoscraper_scrapedjob_changelist')

    def approve_jobs(self, request, queryset):
        published_count = 0
        from .content_extractor import extract_job_details
        
        for scraped_job in queryset:
            if scraped_job.status == 'approved':
                continue # Already approved
            
            # --- Enrichment Step ---
            # Attempt to fetch better details from the source URL before publishing
            # We only do this if description is missing or generic
            if not scraped_job.description or len(scraped_job.description) < 50 or "No description" in scraped_job.description:
                print(f"Enriching job: {scraped_job.title}...")
                details = extract_job_details(scraped_job.url)
                
                if details.get('description') and not details.get('error'):
                    scraped_job.description = details['description']
                
                if details.get('salary_range'):
                    scraped_job.salary_range = details['salary_range']
                    
                if details.get('job_type'):
                    scraped_job.job_type = details['job_type']

                # Update company logo if found and missing
                if details.get('company_logo') and scraped_job.company:
                    if not scraped_job.company.logo_url:
                        scraped_job.company.logo_url = details['company_logo']
                        scraped_job.company.save()
                    
                scraped_job.save()
            # -----------------------

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
                company_logo=scraped_job.company.logo_url if scraped_job.company else None,
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
            
        self.message_user(request, f"{published_count} jobs enriched, approved, and published to the main board.")
    approve_jobs.short_description = "Approve and Publish Selected Jobs"

    def reject_jobs(self, request, queryset):
        queryset.update(status='rejected')
        self.message_user(request, "Selected jobs have been rejected.")
    reject_jobs.short_description = "Reject selected jobs"
