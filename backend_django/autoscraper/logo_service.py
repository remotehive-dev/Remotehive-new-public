"""
Logo fetching service for company logos.
Fetches logos from Brandfetch API with Logo.dev as fallback.
"""

import requests
import logging
from urllib.parse import urlparse
from django.utils import timezone
from datetime import timedelta
from .models import Company

logger = logging.getLogger(__name__)


class LogoFetchService:
    """Fetch company logos and details from multiple sources"""
    
    # Cache duration: don't refetch logos within 30 days
    CACHE_DURATION_DAYS = 30
    
    def __init__(self):
        self.brandfetch_api_key = None  # Will be configured via settings
        
    def enrich_company_details(self, company: Company) -> bool:
        """
        Fetch logo and details for a company object.
        Returns True if successful, False otherwise.
        """
        # Skip if logo already exists and was recently fetched
        if company.logo_url and company.logo_last_fetched:
            cache_expiry = timezone.now() - timedelta(days=self.CACHE_DURATION_DAYS)
            if company.logo_last_fetched > cache_expiry:
                logger.info(f"Using cached details for {company.name}")
                return True
        
        # Skip if previous fetch failed (don't waste API calls)
        if company.logo_fetch_failed:
            logger.info(f"Skipping {company.name} - previous fetch failed")
            return False
        
        # Extract domain from company name or website
        domain = self._get_company_domain(company)
        if not domain:
            logger.warning(f"Could not extract domain for {company.name}")
            company.logo_fetch_failed = True
            company.save()
            return False
        
        # 1. Try Brandfetch API for full details
        details = self._fetch_brandfetch_data(domain)
        
        # 2. Fallback for logo if missing
        if not details or not details.get('logo_url'):
            logo_url = self._fetch_logo_fallback(domain)
            if logo_url:
                if not details: details = {}
                details['logo_url'] = logo_url
        
        # Update company with results
        if details:
            if details.get('logo_url'):
                company.logo_url = details['logo_url']
            
            # Update enrichment fields if they are empty
            if details.get('description') and not company.description:
                company.description = details['description']
            if details.get('linkedin_url') and not company.linkedin_url:
                company.linkedin_url = details['linkedin_url']
            if details.get('twitter_url') and not company.twitter_url:
                company.twitter_url = details['twitter_url']
            if details.get('github_url') and not company.github_url:
                company.github_url = details['github_url']
            
            # New Fields
            if details.get('industry') and not company.industry:
                company.industry = details['industry']
            if details.get('employee_count') and not company.employee_count:
                company.employee_count = details['employee_count']
            if details.get('founded_year') and not company.founded_year:
                company.founded_year = details['founded_year']
            
            company.logo_last_fetched = timezone.now()
            company.logo_fetch_failed = False
            company.save()
            logger.info(f"✅ Enriched {company.name}")
            return True
        else:
            company.logo_fetch_failed = True
            company.logo_last_fetched = timezone.now()
            company.save()
            logger.warning(f"❌ Failed to enrich {company.name}")
            return False

    # Alias for backward compatibility
    def fetch_logo_for_company(self, company: Company) -> bool:
        return self.enrich_company_details(company)
    
    def _get_company_domain(self, company: Company) -> str | None:
        """Extract domain from company details"""
        # First try the domain field
        if company.domain:
            return self._clean_domain(company.domain)
        
        # Try website field
        if company.website:
            return self._extract_domain_from_url(company.website)
        
        # Try to extract from company name
        return self._extract_domain_from_name(company.name)
    
    def _clean_domain(self, domain: str) -> str:
        """Clean and normalize domain"""
        domain = domain.lower().strip()
        # Remove common prefixes
        for prefix in ['http://', 'https://', 'www.']:
            if domain.startswith(prefix):
                domain = domain[len(prefix):]
        # Remove trailing slashes and paths
        domain = domain.split('/')[0]
        return domain
    
    def _extract_domain_from_url(self, url: str) -> str | None:
        """Extract domain from URL"""
        try:
            parsed = urlparse(url)
            domain = parsed.netloc or parsed.path
            return self._clean_domain(domain)
        except:
            return None
    
    def _extract_domain_from_name(self, company_name: str) -> str | None:
        """
        Extract domain from company name using heuristics.
        """
        # Clean the name
        name = company_name.lower().strip()
        
        # Remove common suffixes
        suffixes = [
            ' inc', ' inc.', ' incorporated', ' corp', ' corp.', ' corporation',
            ' ltd', ' ltd.', ' limited', ' llc', ' llc.', ' co', ' co.', ' company',
            ' plc', ' gmbh', ' sa', ' s.a.', ' bv'
        ]
        for suffix in suffixes:
            if name.endswith(suffix):
                name = name[:len(name) - len(suffix)].strip()
        
        # Remove parenthetical content
        if '(' in name:
            name = name.split('(')[0].strip()
        
        # Remove "the" prefix
        if name.startswith('the '):
            name = name[4:].strip()
        
        # Take first word if multiple words
        words = name.split()
        if words:
            domain_base = words[0]
            # Common domain extension
            return f"{domain_base}.com"
        
        return None
    
    def _fetch_brandfetch_data(self, domain: str) -> dict | None:
        """
        Fetch company details from Brandfetch API.
        """
        try:
            url = f"https://api.brandfetch.io/v2/brands/{domain}"
            headers = {}
            if self.brandfetch_api_key:
                headers['Authorization'] = f"Bearer {self.brandfetch_api_key}"
            
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                result = {}
                
                # Extract logo
                logos = data.get('logos', [])
                if logos:
                    logo_formats = logos[0].get('formats', [])
                    if logo_formats:
                        # Prefer PNG
                        for fmt in logo_formats:
                            if fmt.get('format') == 'png':
                                result['logo_url'] = fmt.get('src')
                                break
                        if 'logo_url' not in result:
                            result['logo_url'] = logo_formats[0].get('src')
                            
                # Extract Description
                if data.get('description'):
                    result['description'] = data.get('description')

                # Extract Industry
                if data.get('industry'):
                    result['industry'] = data.get('industry')
                elif data.get('categories') and len(data.get('categories')) > 0:
                     # Fallback to first category
                     result['industry'] = data.get('categories')[0].get('name')

                # Extract Employee Count
                if data.get('employees'):
                    result['employee_count'] = str(data.get('employees'))
                
                # Extract Founded Year
                if data.get('founded'):
                    result['founded_year'] = data.get('founded')
                    
                # Extract Social Links
                links = data.get('links', [])
                for link in links:
                    name = link.get('name', '').lower()
                    url = link.get('url')
                    if 'linkedin' in name:
                        result['linkedin_url'] = url
                    elif 'twitter' in name or 'x.com' in url:
                        result['twitter_url'] = url
                    elif 'github' in name:
                        result['github_url'] = url
                        
                return result
                
            elif response.status_code == 404:
                logger.debug(f"Brandfetch: Brand not found for {domain}")
            else:
                logger.warning(f"Brandfetch error for {domain}: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Brandfetch exception for {domain}: {str(e)}")
            
        return None

    def _fetch_logo_fallback(self, domain: str) -> str | None:
        """
        Fetch logo from fallback sources (Clearbit, Google, Logo.dev).
        """
        # 1. Clearbit
        try:
            logo_url = f"https://logo.clearbit.com/{domain}"
            response = requests.head(logo_url, timeout=5)
            if response.status_code == 200:
                return logo_url
        except Exception:
            pass
        
        # 2. Google Favicons
        try:
            google_url = f"https://www.google.com/s2/favicons?domain={domain}&sz=128"
            return google_url # Google always returns valid image
        except Exception:
            pass

        # 3. Logo.dev
        try:
            logo_url = f"https://img.logo.dev/{domain}?token=pk_X-1ZO13CSquJCEW_3bBg"
            response = requests.head(logo_url, timeout=5)
            if response.status_code == 200:
                return logo_url
        except Exception:
            pass
            
        return None

