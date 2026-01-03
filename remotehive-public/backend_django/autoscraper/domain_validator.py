import logging
from urllib.parse import urlparse
from .models import CompanyScrapeProfile

logger = logging.getLogger(__name__)

class DomainSafetyValidator:
    """
    Enforces Strict Domain Boundary Rule.
    Ensures the scraper NEVER scrapes unintended domains.
    """
    
    @staticmethod
    def is_safe_url(url, profile: CompanyScrapeProfile):
        """
        Validates if a URL is safe to scrape based on the company's profile.
        
        Rule:
        URL.host == company.domain OR 
        URL.host is a subdomain of company.domain
        
        AND URL must match one of the allowed_domains in profile (if specified).
        """
        if not url or not profile:
            return False
            
        try:
            parsed_url = urlparse(url)
            host = parsed_url.netloc.lower()
            
            # Remove 'www.' for normalization
            if host.startswith('www.'):
                host = host[4:]
                
            # 1. Base Domain Check (The absolute minimum)
            base_domain = profile.company.domain.lower()
            if base_domain.startswith('www.'):
                base_domain = base_domain[4:]
                
            is_match = (host == base_domain) or host.endswith(f".{base_domain}")
            
            if not is_match:
                logger.warning(f"Domain Mismatch Blocked: {host} is not {base_domain}")
                return False
                
            # 2. Strict Allowed Domains List (If configured)
            # If allowed_domains is empty, we rely on the base domain check above.
            # If allowed_domains has entries, the URL MUST match one of them.
            allowed_list = profile.allowed_domains
            if allowed_list:
                allowed_match = False
                for allowed in allowed_list:
                    allowed = allowed.lower().replace('www.', '')
                    if host == allowed or host.endswith(f".{allowed}"):
                        allowed_match = True
                        break
                
                if not allowed_match:
                    logger.warning(f"Strict Allowed List Blocked: {host} not in {allowed_list}")
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"Domain Validation Error for {url}: {e}")
            return False

    @staticmethod
    def validate_discovery_results(urls, profile: CompanyScrapeProfile):
        """
        Filters a list of discovered URLs, returning only safe ones.
        """
        safe_urls = []
        for url in urls:
            if DomainSafetyValidator.is_safe_url(url, profile):
                safe_urls.append(url)
        return safe_urls
