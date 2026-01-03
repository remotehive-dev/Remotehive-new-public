import json
import logging
import requests
from django.conf import settings
from core.models import APIConfiguration
from core.taxonomy_models import JobRole

logger = logging.getLogger(__name__)

class LLMScraperHelper:
    """
    Helper class to interact with OpenRouter (ChatGPT OSS) for parsing job content.
    """
    
    def __init__(self):
        self.api_key = self._get_api_key()
        self.base_url = "https://openrouter.ai/api/v1"
        self.model = "openai/gpt-3.5-turbo" # Default, can be configured
        
    def _get_api_key(self):
        try:
            # Check for specific 'openrouter' config first
            config = APIConfiguration.objects.filter(service_name='openrouter', is_active=True).first()
            if config:
                if config.extra_config and 'model' in config.extra_config:
                    self.model = config.extra_config['model']
                return config.api_key
            
            # Fallback to 'chatgpt' or similar if named differently
            config = APIConfiguration.objects.filter(service_name__icontains='chatgpt', is_active=True).first()
            if config:
                return config.api_key
                
            return None
        except Exception as e:
            logger.error(f"Error fetching OpenRouter API config: {e}")
            return None

    def parse_job_content(self, raw_content, company_name, url):
        """
        Parses raw job content (HTML text) into structured data using LLM.
        Returns a dictionary matching the ScrapedJob schema.
        """
        if not self.api_key:
            logger.warning("OpenRouter API key not configured. Skipping LLM parsing.")
            return None

        # Fetch valid job roles for normalization
        valid_roles = list(JobRole.objects.values_list('name', flat=True))
        # Limit the list to top 100 to avoid token limits if necessary, or pass top categories
        valid_roles_str = ", ".join(valid_roles[:100]) 

        prompt = f"""
        You are an intelligent job scraper assistant. Your task is to extract structured job data from the following raw text scraped from a company's career page.
        
        Company: {company_name}
        URL: {url}
        
        Valid Job Roles (Taxonomy): {valid_roles_str}
        
        Extract the following fields in strict JSON format:
        1. "title": The job title.
        2. "job_role": Best matching role from the provided taxonomy list. If no match, use the closest standard industry role.
        3. "description": A clean, formatted summary of the job description (HTML allowed, but keep it safe).
        4. "location": City, Country or "Remote".
        5. "experience_required": e.g., "3-5 years", "Senior", "Entry Level".
        6. "salary_range": e.g., "$100k - $120k", "Competitive", or null if not found.
        7. "job_type": "Full Time", "Part Time", "Contract", "Internship".
        8. "is_remote": boolean (true/false).
        9. "direct_apply_link": The URL to apply (if different from the source URL, otherwise use source URL).
        
        If the content does not look like a job posting (e.g. list of jobs, login page, error page), return {{"error": "Not a job posting"}}.
        
        Raw Content (Truncated):
        {raw_content[:4000]}
        """

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://remotehive.io", # Optional, for OpenRouter rankings
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are a helpful assistant that parses job descriptions into JSON."},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"}
        }

        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            
            content = result['choices'][0]['message']['content']
            parsed_data = json.loads(content)
            
            return parsed_data
            
        except Exception as e:
            logger.error(f"LLM Parsing failed: {e}")
            return None
