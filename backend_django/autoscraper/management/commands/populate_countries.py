from django.core.management.base import BaseCommand
from autoscraper.models import Country

class Command(BaseCommand):
    help = 'Populates the Country model with ISO 3166-1 Alpha-2 codes'

    def handle(self, *args, **kwargs):
        countries = [
            {"name": "United States", "code": "US", "languages": "en", "flag": "🇺🇸"},
            {"name": "United Kingdom", "code": "GB", "languages": "en", "flag": "🇬🇧"},
            {"name": "India", "code": "IN", "languages": "en, hi", "flag": "🇮🇳"},
            {"name": "Canada", "code": "CA", "languages": "en, fr", "flag": "🇨🇦"},
            {"name": "Australia", "code": "AU", "languages": "en", "flag": "🇦🇺"},
            {"name": "Germany", "code": "DE", "languages": "de", "flag": "🇩🇪"},
            {"name": "France", "code": "FR", "languages": "fr", "flag": "🇫🇷"},
            {"name": "Spain", "code": "ES", "languages": "es", "flag": "🇪🇸"},
            {"name": "Brazil", "code": "BR", "languages": "pt", "flag": "🇧🇷"},
            {"name": "Singapore", "code": "SG", "languages": "en, ms, ta, zh", "flag": "🇸🇬"},
            {"name": "Netherlands", "code": "NL", "languages": "nl", "flag": "🇳🇱"},
            {"name": "Sweden", "code": "SE", "languages": "sv", "flag": "🇸🇪"},
            {"name": "Ireland", "code": "IE", "languages": "en, ga", "flag": "🇮🇪"},
            {"name": "Japan", "code": "JP", "languages": "ja", "flag": "🇯🇵"},
            {"name": "China", "code": "CN", "languages": "zh", "flag": "🇨🇳"},
            {"name": "Mexico", "code": "MX", "languages": "es", "flag": "🇲🇽"},
            {"name": "Italy", "code": "IT", "languages": "it", "flag": "🇮🇹"},
            {"name": "Poland", "code": "PL", "languages": "pl", "flag": "🇵🇱"},
            {"name": "Switzerland", "code": "CH", "languages": "de, fr, it", "flag": "🇨🇭"},
            {"name": "United Arab Emirates", "code": "AE", "languages": "ar", "flag": "🇦🇪"},
        ]

        count = 0
        for c in countries:
            obj, created = Country.objects.update_or_create(
                code=c['code'],
                defaults={
                    'name': c['name'],
                    'languages': c['languages'],
                    'flag_emoji': c['flag']
                }
            )
            if created:
                count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Successfully populated {count} new countries (Updated {len(countries) - count}).'))
