import requests
import logging
from datetime import datetime
from django.utils import timezone
from core.models import APIConfiguration
from .models import ScrapedJob, ScraperSource, Company
from .logo_service import LogoFetchService

logger = logging.getLogger(__name__)

def get_api_config(service_name):
    try:
        config = APIConfiguration.objects.get(service_name=service_name, is_active=True)
        return config
    except APIConfiguration.DoesNotExist:
        logger.error(f"API Configuration for {service_name} not found or inactive.")
        return None

def test_api_connection(service_name):
    """
    Tests the connection to the specified service by making a minimal request.
    Returns (success: bool, message: str)
    """
    config = get_api_config(service_name)
    if not config:
        return False, "Configuration not found or inactive."

    try:
        if service_name == 'rapidapi':
            url = config.base_url or "https://active-jobs-db.p.rapidapi.com/active-ats-7d"
            headers = {
                'x-rapidapi-host': "active-jobs-db.p.rapidapi.com",
                'x-rapidapi-key': config.api_key
            }
            # Minimal request
            params = {'limit': '1', 'offset': '0', 'title_filter': '"Test"'}
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            return True, "Connection successful! RapidAPI responded."

        elif service_name == 'linkedin':
            # Use the config base_url ONLY if it's set and non-empty
            # Otherwise use the default working endpoint
            if config.base_url and config.base_url.strip():
                url = config.base_url
            else:
                url = "https://linkedin-job-search-api.p.rapidapi.com/active-jb-24h"
            
            headers = {
                'x-rapidapi-host': "linkedin-job-search-api.p.rapidapi.com",
                'x-rapidapi-key': config.api_key
            }
            # Minimal request to test connection
            params = {
                'limit': '1', 
                'offset': '0', 
                'title_filter': '"Test"',
                'description_type': 'text'
            }
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            return True, "Connection successful! LinkedIn Job Search API responded."

        elif service_name == 'serp':
            url = "https://serpapi.com/search.json"
            params = {
                'engine': 'google_jobs',
                'q': 'Test',
                'api_key': config.api_key,
                'num': '1'
            }
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            return True, "Connection successful! SERP API responded."
            
        else:
            return False, f"Unknown service: {service_name}"

    except requests.exceptions.RequestException as e:
        return False, f"Connection failed: {str(e)}"
    except Exception as e:
        return False, f"Unexpected error: {str(e)}"

def fetch_rapid_jobs(limit=10, query="Data Engineer", location_filter='"United States" OR "United Kingdom"'):
    # Default key from user request
    DEFAULT_KEY = "93f762925emsh74cd24848ae8a54p1aee40jsn35194321c7bb"
    
    config = get_api_config('rapidapi')
    api_key = config.api_key if config else DEFAULT_KEY
    
    url = config.base_url if config and config.base_url else "https://active-jobs-db.p.rapidapi.com/active-ats-7d"
    
    headers = {
        'x-rapidapi-host': "active-jobs-db.p.rapidapi.com",
        'x-rapidapi-key': api_key
    }
    
    # Query construction based on user cURL
    params = {
        'limit': str(limit),
        'offset': '0',
        'title_filter': f'"{query}"',
        'location_filter': location_filter,
        'description_type': 'text'
    }

    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()
        
        count = 0
        source, _ = ScraperSource.objects.get_or_create(
            name="RapidAPI - Active Jobs DB",
            defaults={'url': "https://rapidapi.com/active-jobs-db"}
        )
        
        # Initialize logo service
        logo_service = LogoFetchService()

        for item in data:
            job_url = item.get('url')
            if not job_url:
                continue
                
            # Check for duplicates
            if ScrapedJob.objects.filter(url=job_url).exists():
                continue

            # Extract location
            locations = item.get('locations_derived', [])
            location = locations[0] if locations else "Unknown"
            
            # Get or create company
            company_name = item.get('organization', 'Unknown')
            organization_url = item.get('organization_url')
            
            company, created = Company.objects.get_or_create(
                name=company_name,
                defaults={
                    'website': organization_url,
                }
            )
            
            # Fetch logo for new companies or companies without logos
            if created or not company.logo_url:
                logo_service.fetch_logo_for_company(company)

            ScrapedJob.objects.create(
                source=source,
                title=item.get('title', 'Untitled'),
                company=company,
                company_text=company_name,
                location=location,
                url=job_url,
                description=f"Job ID: {item.get('id')}. Source: {item.get('source')}",
                is_remote=item.get('remote_derived', False),
                posted_date=timezone.now().date(), # Using current date as fallback
                status='new'
            )
            count += 1
            
        source.last_scraped = timezone.now()
        source.save()
        return count, None

    except Exception as e:
        logger.error(f"Error fetching from RapidAPI: {str(e)}")
        return 0, str(e)

def fetch_linkedin_jobs(limit=10, query="Data Engineer", location_filter='"United States" OR "United Kingdom"'):
    # Default key from user request if config is missing (fallback)
    DEFAULT_KEY = "78006bf87amsh5f51ac5ed6578e7p1b3f42jsneb267075601b"
    
    config = get_api_config('linkedin')
    api_key = config.api_key if config else DEFAULT_KEY
    
    # Base URL from config or default - use the working /active-jb-24h endpoint
    if config and config.base_url and config.base_url.strip():
        url = config.base_url
    else:
        url = "https://linkedin-job-search-api.p.rapidapi.com/active-jb-24h"
    
    headers = {
        'x-rapidapi-host': "linkedin-job-search-api.p.rapidapi.com",
        'x-rapidapi-key': api_key
    }
    
    # Query construction based on user cURL
    params = {
        'limit': str(limit),
        'offset': '0',
        'title_filter': f'"{query}"',
        'location_filter': location_filter,
        'description_type': 'text'
    }

    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()
        
        count = 0
        source, _ = ScraperSource.objects.get_or_create(
            name="RapidAPI - LinkedIn Job Search",
            defaults={'url': "https://rapidapi.com/linkedin-job-search-api"}
        )
        
        # Initialize logo service
        logo_service = LogoFetchService()

        for item in data:
            job_url = item.get('url')
            if not job_url:
                continue
                
            # Check for duplicates
            if ScrapedJob.objects.filter(url=job_url).exists():
                continue

            # Extract location
            locations = item.get('locations_derived', [])
            location = locations[0] if locations else item.get('location', "Unknown")
            
            # Get or create company
            company_name = item.get('organization', 'Unknown')
            organization_url = item.get('organization_url') or item.get('linkedin_org_url')
            
            company, created = Company.objects.get_or_create(
                name=company_name,
                defaults={
                    'website': organization_url,
                    'description': item.get('linkedin_org_description'),
                }
            )
            
            # Fetch logo for new companies or companies without logos
            # LinkedIn API may provide logo URL directly
            if item.get('organization_logo'):
                if not company.logo_url:
                    company.logo_url = item.get('organization_logo')
                    company.save()
            elif created or not company.logo_url:
                logo_service.fetch_logo_for_company(company)

            ScrapedJob.objects.create(
                source=source,
                title=item.get('title', 'Untitled'),
                company=company,
                company_text=company_name,
                location=location,
                url=job_url,
                description=item.get('description', 'No description provided.'),
                is_remote=item.get('remote_derived', False),
                posted_date=timezone.now().date(), # Using current date as fallback
                status='new'
            )
            count += 1
            
        source.last_scraped = timezone.now()
        source.save()
        return count, None

    except Exception as e:
        logger.error(f"Error fetching from LinkedIn API: {str(e)}")
        return 0, str(e)

def fetch_serp_jobs(limit=20, query="Remote Developer"):
    config = get_api_config('serp')
    if not config:
        return 0, "Configuration not found"

    url = "https://serpapi.com/search.json"
    params = {
        'engine': 'google_jobs',
        'q': query,
        'api_key': config.api_key,
        'num': str(limit) # SERP API uses 'num' for limit
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        jobs_results = data.get('jobs_results', [])
        count = 0
        
        source, _ = ScraperSource.objects.get_or_create(
            name="SERP API - Google Jobs",
            defaults={'url': "https://serpapi.com/"}
        )
        
        # Initialize logo service
        logo_service = LogoFetchService()

        for item in jobs_results:
            # SERP API structure might vary, but usually has title, company_name, location, etc.
            job_id = item.get('job_id')
            
            # Construct a URL if not provided directly (Google Jobs often links to Google search)
            # But usually 'related_links' or 'apply_options' has the link.
            apply_options = item.get('apply_options', [])
            job_url = apply_options[0].get('link') if apply_options else f"https://google.com/search?q={job_id}"
            
            if ScrapedJob.objects.filter(url=job_url).exists():
                continue
            
            # Get or create company
            company_name = item.get('company_name', 'Unknown')
            
            company, created = Company.objects.get_or_create(
                name=company_name
            )
            
            # Fetch logo for new companies or companies without logos
            if created or not company.logo_url:
                logo_service.fetch_logo_for_company(company)

            ScrapedJob.objects.create(
                source=source,
                title=item.get('title', 'Untitled'),
                company=company,
                company_text=company_name,
                location=item.get('location', 'Unknown'),
                url=job_url,
                description=item.get('description', 'No description provided.'),
                is_remote='remote' in item.get('location', '').lower() or 'remote' in item.get('title', '').lower(),
                posted_date=timezone.now().date(),
                status='new'
            )
            count += 1

        source.last_scraped = timezone.now()
        source.save()
        return count, None

    except Exception as e:
        logger.error(f"Error fetching from SERP API: {str(e)}")
        return 0, str(e)
