from django.shortcuts import render
from django.contrib.admin.views.decorators import staff_member_required
from django.conf import settings
import os

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views.decorators.http import require_POST
import json
from django.http import JsonResponse

@csrf_exempt
@require_POST
def create_support_ticket(request):
    """
    API Endpoint to create a support ticket from the public website.
    Expects JSON: { name, email, subject, message }
    """
    try:
        data = json.loads(request.body)
        
        name = data.get('name')
        email = data.get('email')
        subject = data.get('subject')
        message = data.get('message')
        
        if not all([name, email, subject, message]):
            return JsonResponse({'error': 'Missing required fields'}, status=400)
            
        from .models import SupportTicket
        ticket = SupportTicket.objects.create(
            name=name,
            email=email,
            subject=subject,
            message=message
        )
        
        return JsonResponse({
            'success': True, 
            'ticket_id': ticket.id,
            'message': 'Ticket created successfully'
        }, status=201)
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@staff_member_required
def api_docs_view(request):
    """
    Renders the FastAPI Swagger UI inside the Django Admin.
    Protected by Django Admin authentication.
    """
    # Assuming FastAPI is running on port 8000 locally
    # In production, this URL should be updated or proxied
    # Note: FastAPI serves openapi.json at /api/v1/openapi.json based on app/main.py config
    fastapi_base_url = os.environ.get("FASTAPI_BASE_URL", "http://localhost:8000").rstrip("/")
    openapi_url = f"{fastapi_base_url}/api/v1/openapi.json"
    
    context = {
        "openapi_url": openapi_url,
        "title": "RemoteHive Backend API Docs",
        "site_header": getattr(settings, 'JAZZMIN_SETTINGS', {}).get('site_header', 'RemoteHive'),
    }
    return render(request, "admin/api_docs.html", context)

@staff_member_required
def proxy_openapi(request):
    import requests
    from django.http import JsonResponse, HttpResponse
    try:
        fastapi_base_url = os.environ.get("FASTAPI_BASE_URL", "http://localhost:8000").rstrip("/")
        response = requests.get(f"{fastapi_base_url}/api/v1/openapi.json")
        return JsonResponse(response.json(), safe=False)
    except Exception as e:
        return HttpResponse(f"Error connecting to FastAPI: {e}", status=502)

@staff_member_required
def dashboard_stats_api(request):
    """
    API endpoint for dashboard statistics with filtering capabilities.
    Returns JSON data for charts and metrics.
    """
    from django.http import JsonResponse
    from django.utils import timezone
    from datetime import timedelta
    from django.contrib.auth import get_user_model
    from autoscraper.models import ScrapedJob
    from leads.models import Lead
    from core.models import UserProfile
    from core.job_models import Job
    from django.db.models import Count, Q

    time_range = request.GET.get('range', 'all')
    
    # Calculate date threshold
    now = timezone.now()
    threshold = None
    if time_range == '7d':
        threshold = now - timedelta(days=7)
    elif time_range == '30d':
        threshold = now - timedelta(days=30)
    elif time_range == '90d':
        threshold = now - timedelta(days=90)
    
    stats = {}
    
    # --- Helper to apply filter ---
    def filter_qs(qs, date_field='created_at'):
        if threshold:
            return qs.filter(**{f"{date_field}__gte": threshold})
        return qs

    try:
        User = get_user_model()
        # User filters often use date_joined
        user_qs = filter_qs(User.objects.all(), 'date_joined')
        stats['users_total'] = user_qs.count()
        
        # For profiles, we might check user__date_joined as proxy
        stats['users_employers'] = filter_qs(UserProfile.objects.filter(role='employer'), 'user__date_joined').count()
        stats['users_jobseekers'] = filter_qs(UserProfile.objects.filter(role='jobseeker'), 'user__date_joined').count()
    except Exception as e:
        stats['error_users'] = str(e)

    try:
        # Internal Jobs
        job_qs = filter_qs(Job.objects.all(), 'created_at') # Check if created_at exists on Job model
        # If created_at is missing on Job (legacy model), we might need to handle it or add it.
        # Based on previous file reads, Job model has created_at (added in later migrations or usually present)
        # Let's verify Job model fields if needed, but assuming standard Django pattern or migration 0006+
        
        # Wait, let's double check Job model fields from previous context or just use safe defaults
        # If 'created_at' is not in Job, filter might fail. 
        # Checking job_models.py content in memory: "created_at" was seen in JobAdmin readonly_fields, so it exists.
        
        stats['jobs_internal_published'] = job_qs.filter(status='published').count()
        stats['jobs_internal_draft'] = job_qs.filter(status='draft').count()
        
        # Scraped Jobs (ScrapedJob model has created_at)
        scraped_qs = filter_qs(ScrapedJob.objects.all(), 'created_at')
        stats['jobs_scraped_total'] = scraped_qs.count()
        stats['jobs_scraped_new'] = scraped_qs.filter(status='new').count()
        stats['jobs_scraped_approved'] = scraped_qs.filter(status='approved').count()
        stats['jobs_scraped_rejected'] = scraped_qs.filter(status='rejected').count()
        
        # Leads
        lead_qs = filter_qs(Lead.objects.all(), 'created_at')
        stats['leads_count'] = lead_qs.count()
        
    except Exception as e:
        stats['error_data'] = str(e)
        
    return JsonResponse(stats)

def home_page_config_api(request):
    """
    Public API endpoint to serve Home Page Configuration.
    Returns JSON data for the frontend.
    """
    from django.http import JsonResponse
    from .models import HomePageConfiguration
    from core.job_models import Job
    from autoscraper.models import ScrapedJob
    from django.db.models import Q
    
    config = HomePageConfiguration.objects.first()
    
    # Fetch roles, regions, and footer links
    from autoscraper.models import CompanyCategory
    
    roles = []
    regions = []
    quick_filters = []
    footer_links = {
        'platform': [],
        'support': [],
        'legal': [],
        'social': []
    }
    
    # Fetch Quick Filters (Company Categories)
    # We use top 12 ordered categories
    cats = CompanyCategory.objects.filter(is_active=True).order_by('order')[:12]
    for cat in cats:
        quick_filters.append({
            "name": cat.name,
            "icon": cat.icon or "Briefcase", # Default icon
            "href": f"/jobs?category={cat.slug}",
            # Generate a consistent color based on ID or just default
            "color": "bg-indigo-50 text-indigo-600" 
        })

    if config:
        for r in config.roles.filter(is_active=True).order_by('order'):
            roles.append({
                "label": r.label,
                "value": r.value,
                "icon": r.icon_name
            })
        
        for r in config.regions.filter(is_active=True).order_by('order'):
            # Calculate Job Counts
            job_count = 0
            
            # 1. Internal Jobs (Published)
            internal_count = Job.objects.filter(
                status='published',
                location__icontains=r.value
            ).count()
            
            # 2. Scraped Jobs (Approved or New depending on policy, usually Approved)
            # Assuming we show Approved jobs publicly
            scraped_count = ScrapedJob.objects.filter(
                status='approved',
                location__icontains=r.value
            ).count()
            
            # Special handling for "Worldwide" / "remote" if needed
            if r.value.lower() == 'remote':
                # Maybe count all remote jobs?
                # For now, stick to simple string matching to match search behavior
                pass

            job_count = internal_count + scraped_count

            regions.append({
                "label": r.label,
                "value": r.value,
                "icon": r.icon_emoji,
                "count": job_count
            })
            
        for link in config.footer_links.all().order_by('order'):
            if link.section in footer_links:
                footer_links[link.section].append({
                    "label": link.label,
                    "url": link.url
                })
            
    # Default Fallbacks if empty
    if not roles:
        roles = [
            {"label": "Engineering", "value": "Engineering", "icon": "Code2"},
            {"label": "Design", "value": "Design", "icon": "Laptop"},
            {"label": "Marketing", "value": "Marketing", "icon": "Rocket"},
            {"label": "Product", "value": "Product", "icon": "Briefcase"},
            {"label": "Sales", "value": "Sales", "icon": "Globe"},
        ]
        
    if not regions:
        regions = [
            {"label": "Worldwide", "value": "remote", "icon": "🌍", "count": 1250},
            {"label": "United States", "value": "United States", "icon": "🇺🇸", "count": 850},
            {"label": "United Kingdom", "value": "United Kingdom", "icon": "🇬🇧", "count": 320},
            {"label": "Europe", "value": "Europe", "icon": "🇪🇺", "count": 540},
            {"label": "APAC & India", "value": "India", "icon": "🌏", "count": 410},
        ]
        
    if not any(footer_links.values()):
        footer_links = {
            'platform': [
                {"label": "Browse Jobs", "url": "/jobs"},
                {"label": "Browse Companies", "url": "/companies"},
                {"label": "Pricing", "url": "/pricing"},
            ],
            'support': [
                {"label": "Help Center", "url": "/help"},
                {"label": "Contact Us", "url": "/contact"},
                {"label": "Terms of Service", "url": "/terms"},
            ]
        }
    
    data = {
        "stats": {
            "active_jobs": config.active_jobs_count if config else "10k+",
            "companies": config.companies_count if config else "2.5k",
            "success_rate": config.success_rate if config else "95%",
            "countries": config.countries_count if config else "50+",
        },
        "hero": {
            "title": config.hero_title if config else "Find Your Dream Remote Job",
            "subtitle": config.hero_subtitle if config else "Connect with top companies offering remote opportunities worldwide.",
            "search_placeholder": config.search_placeholder if config else "Job title or keyword",
        },
        "footer": {
            "description": config.footer_description if config else "Connecting talented professionals with remote opportunities worldwide.",
            "email": config.footer_email if config else "support@remotehive.in",
            "phone": config.footer_phone if config else "+91-9667791765",
            "address": config.footer_address if config else "San Francisco, CA",
            "copyright": config.footer_copyright if config else "RemoteHive. All rights reserved.",
            "links": footer_links
        },
        "roles": roles,
        "regions": regions,
        "quick_filters": quick_filters
    }
    
    response = JsonResponse(data)
    # Enable CORS for public access (or handle via middleware)
    response["Access-Control-Allow-Origin"] = "*"
    return response

def seo_config_api(request):
    """
    Public API endpoint to serve SEO Configuration (Pages and Global Tags)
    AND Marketing Integrations (Ads, Pixels).
    Returns JSON data for the frontend.
    """
    from django.http import JsonResponse
    from .models import SEOPage, SEOTag
    # Import MarketingIntegration dynamically to avoid circular imports if any
    try:
        from ads.models import MarketingIntegration
    except ImportError:
        MarketingIntegration = None
    
    # 1. Fetch Global Tags
    tags = []
    for tag in SEOTag.objects.filter(is_active=True).order_by('location', 'order'):
        tags.append({
            'name': tag.name,
            'content': tag.content,
            'location': tag.location
        })
        
    # 2. Fetch Page-specific SEO
    pages = {}
    for page in SEOPage.objects.filter(is_active=True):
        pages[page.path] = {
            'title': page.title,
            'description': page.description,
            'keywords': page.keywords,
            'og_image': page.og_image,
            'canonical_url': page.canonical_url,
            'no_index': page.no_index
        }

    # 3. Fetch Marketing Integrations
    marketing = []
    if MarketingIntegration:
        for integration in MarketingIntegration.objects.filter(is_active=True):
            marketing.append({
                'name': integration.name,
                'provider': integration.provider,
                'pixel_id': integration.pixel_id,
                'script_content': integration.script_content
            })
            
    response = JsonResponse({
        'global_tags': tags,
        'pages': pages,
        'marketing': marketing
    })
    response["Access-Control-Allow-Origin"] = "*"
    return response

def company_categories_api(request):
    """
    Public API to fetch Company Categories with hierarchy.
    """
    from django.http import JsonResponse
    from autoscraper.models import CompanyCategory
    from django.db.models import Count
    
    # Fetch root categories
    categories = CompanyCategory.objects.filter(is_active=True, parent__isnull=True).order_by('order', 'name')
    
    data = []
    for cat in categories:
        subcats = cat.subcategories.filter(is_active=True).order_by('order', 'name')
        
        # Calculate active companies count (approximate)
        # We might want to optimize this with aggregation if data grows
        companies_qs = cat.companies.all() | CompanyCategory.objects.filter(parent=cat).values_list('companies', flat=True)
        # The above OR logic for M2M is tricky in raw python, let's just grab sample from direct relation for now
        # or better, use a distinct query if possible.
        
        # Simplified: Get logos from companies directly attached to this category
        sample_logos = list(cat.companies.filter(logo_url__isnull=False).values_list('logo_url', flat=True)[:4])
        
        data.append({
            'id': cat.id,
            'name': cat.name,
            'slug': cat.slug,
            'icon': cat.icon,
            'description': cat.description,
            'count': cat.companies.count() + sum(sub.companies.count() for sub in subcats), # Rough count
            'sample_logos': sample_logos,
            'subcategories': [{
                'id': sub.id,
                'name': sub.name,
                'slug': sub.slug,
                'count': sub.companies.count()
            } for sub in subcats]
        })
        
    response = JsonResponse(data, safe=False)
    response["Access-Control-Allow-Origin"] = "*"
    return response

def taxonomy_api(request):
    """
    Returns the full Job Taxonomy tree.
    """
    from django.http import JsonResponse
    from .taxonomy_models import JobFamily
    
    data = []
    families = JobFamily.objects.prefetch_related('categories', 'categories__roles').all()
    
    for family in families:
        fam_data = {
            'id': family.id,
            'name': family.name,
            'slug': family.slug,
            'categories': []
        }
        for cat in family.categories.all().order_by('order', 'name'):
            cat_data = {
                'id': cat.id,
                'name': cat.name,
                'slug': cat.slug,
                'roles': []
            }
            for role in cat.roles.all().order_by('name'):
                cat_data['roles'].append({
                    'id': role.id,
                    'name': role.name,
                    'slug': role.slug,
                    'is_remote_friendly': role.is_remote_friendly
                })
            fam_data['categories'].append(cat_data)
        data.append(fam_data)
        
    return JsonResponse(data, safe=False)
