from django.core.management.base import BaseCommand
from autoscraper.models import Company, Country
from urllib.parse import urlparse

class Command(BaseCommand):
    help = 'Map companies to countries based on domain TLDs and description text'

    def handle(self, *args, **kwargs):
        # TLD Map
        tld_map = {
            'uk': 'GB', 'co.uk': 'GB',
            'de': 'DE',
            'fr': 'FR',
            'es': 'ES',
            'it': 'IT',
            'nl': 'NL',
            'se': 'SE',
            'br': 'BR',
            'in': 'IN', 'co.in': 'IN',
            'au': 'AU', 'com.au': 'AU',
            'ca': 'CA',
            'cn': 'CN',
            'jp': 'JP', 'co.jp': 'JP',
            'sg': 'SG', 'com.sg': 'SG',
            'ae': 'AE',
            'ch': 'CH',
            'ie': 'IE',
        }
        
        # Region Name Map (Simple text matching)
        country_names = {c.name.lower(): c for c in Country.objects.all()}
        
        companies = Company.objects.filter(country__isnull=True)
        updated_count = 0
        
        for company in companies:
            mapped_country = None
            
            # 1. Check Description for "Region: X" (from CSV import)
            if company.description:
                desc_lower = company.description.lower()
                for name, country in country_names.items():
                    if f"region: {name}" in desc_lower or f"location: {name}" in desc_lower:
                        mapped_country = country
                        break
            
            # 2. Check TLD if not found
            if not mapped_country and company.domain:
                parts = company.domain.split('.')
                if len(parts) > 1:
                    tld = parts[-1]
                    if len(parts) > 2 and parts[-2] in ['co', 'com', 'org', 'net']:
                         # Handle .co.uk, .com.au
                         tld = f"{parts[-2]}.{parts[-1]}"
                    
                    code = tld_map.get(tld)
                    if code:
                        try:
                            mapped_country = Country.objects.get(code=code)
                        except Country.DoesNotExist:
                            pass
                            
            # 3. Save if found
            if mapped_country:
                company.country = mapped_country
                company.save()
                updated_count += 1
                self.stdout.write(f"Mapped {company.name} -> {mapped_country.name}")
        
        self.stdout.write(self.style.SUCCESS(f'Successfully mapped {updated_count} companies to countries.'))
