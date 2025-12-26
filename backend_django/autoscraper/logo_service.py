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
    """Fetch company logos from multiple sources"""
    
    # Cache duration: don't refetch logos within 30 days
    CACHE_DURATION_DAYS = 30
    
    def __init__(self):
        self.brandfetch_api_key = None  # Will be configured via settings
        
    def fetch_logo_for_company(self, company: Company) -> bool:
        """
        Fetch logo for a company object.
        Returns True if successful, False otherwise.
        """
        # Skip if logo already exists and was recently fetched
        if company.logo_url and company.logo_last_fetched:
            cache_expiry = timezone.now() - timedelta(days=self.CACHE_DURATION_DAYS)
            if company.logo_last_fetched > cache_expiry:
                logger.info(f"Using cached logo for {company.name}")
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
        
        # Try Brandfetch API first
        logo_url = self._fetch_from_brandfetch(domain)
        
        # Fallback to Logo.dev
        if not logo_url:
            logo_url = self._fetch_from_logodev(domain)
        
        # Update company with results
        if logo_url:
            company.logo_url = logo_url
            company.logo_last_fetched = timezone.now()
            company.logo_fetch_failed = False
            company.save()
            logger.info(f"✅ Fetched logo for {company.name}: {logo_url}")
            return True
        else:
            company.logo_fetch_failed = True
            company.logo_last_fetched = timezone.now()
            company.save()
            logger.warning(f"❌ Failed to fetch logo for {company.name}")
            return False
    
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
        Examples:
        - "Google" -> "google.com"
        - "Microsoft Corporation" -> "microsoft.com"
        - "Meta (Facebook)" -> "meta.com"
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
    
    def _fetch_from_brandfetch(self, domain: str) -> str | None:
        """
        Fetch logo from Brandfetch API.
        Free tier: 500k requests/month
        No API key required for basic usage
        """
        try:
            # Brandfetch Logo API endpoint
            url = f"https://api.brandfetch.io/v2/brands/{domain}"
            
            headers = {}
            if self.brandfetch_api_key:
                headers['Authorization'] = f"Bearer {self.brandfetch_api_key}"
            
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                # Extract logo from response
                logos = data.get('logos', [])
                if logos:
                    # Get the first logo (usually the primary one)
                    logo_formats = logos[0].get('formats', [])
                    if logo_formats:
                        # Prefer PNG format
                        for fmt in logo_formats:
                            if fmt.get('format') == 'png':
                                return fmt.get('src')
                        # Fallback to any format
                        return logo_formats[0].get('src')
            elif response.status_code == 404:
                logger.debug(f"Brandfetch: Brand not found for {domain}")
            else:
                logger.warning(f"Brandfetch error for {domain}: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Brandfetch exception for {domain}: {str(e)}")
        
        return None
    
    def _fetch_from_logodev(self, domain: str) -> str | None:
        """
        Fetch logo from Logo.dev API.
        Free tier: 5000 requests/day
        No API key required
        """
        try:
            # Logo.dev simple URL format
            logo_url = f"https://img.logo.dev/{domain}?token=pk_X-1ZO13CSquJCEW_3bBg"
            
            # Verify the logo exists by making a HEAD request
            response = requests.head(logo_url, timeout=5)
            
            if response.status_code == 200:
                return logo_url
            else:
                logger.debug(f"Logo.dev: Logo not available for {domain}")
                
        except Exception as e:
            logger.error(f"Logo.dev exception for {domain}: {str(e)}")
        
        return None
