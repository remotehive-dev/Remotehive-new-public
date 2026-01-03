from django.core.management.base import BaseCommand
from core.models import HomePageConfiguration, HomePageRegion, HomePageRole, FooterLink

class Command(BaseCommand):
    help = 'Populates the Home Page Configuration with default data'

    def handle(self, *args, **kwargs):
        self.stdout.write("Checking Home Page Configuration...")
        
        # 1. Main Config
        config, created = HomePageConfiguration.objects.get_or_create(id=1, defaults={
            'hero_title': "Find Your Dream Remote Job",
            'hero_subtitle': "Connect with top companies offering remote opportunities worldwide. Your next career move is just a click away.",
            'search_placeholder': "Job title or keyword",
            'active_jobs_count': "10k+",
            'companies_count': "2.5k",
            'success_rate': "95%",
            'countries_count': "50+",
            'footer_description': "Connecting talented professionals with remote opportunities worldwide.",
            'footer_email': "support@remotehive.in",
            'footer_phone': "+91-9667791765",
            'footer_address': "San Francisco, CA",
            'footer_copyright': "RemoteHive. All rights reserved."
        })
        
        if created:
            self.stdout.write(self.style.SUCCESS("Created new Home Page Configuration."))
        else:
            self.stdout.write("Home Page Configuration already exists.")

        # 2. Regions
        regions = [
            {'label': 'Worldwide', 'value': 'remote', 'icon': '🌍', 'order': 1},
            {'label': 'United States', 'value': 'United States', 'icon': '🇺🇸', 'order': 2},
            {'label': 'United Kingdom', 'value': 'United Kingdom', 'icon': '🇬🇧', 'order': 3},
            {'label': 'Europe', 'value': 'Europe', 'icon': '🇪🇺', 'order': 4},
            {'label': 'APAC & India', 'value': 'India', 'icon': '🌏', 'order': 5},
            {'label': 'Canada', 'value': 'Canada', 'icon': '🇨🇦', 'order': 6},
            {'label': 'Australia', 'value': 'Australia', 'icon': '🇦🇺', 'order': 7},
            {'label': 'Latin America', 'value': 'Latin America', 'icon': '💃', 'order': 8},
        ]
        
        for r in regions:
            obj, created = HomePageRegion.objects.get_or_create(
                config=config,
                value=r['value'],
                defaults={
                    'label': r['label'],
                    'icon_emoji': r['icon'],
                    'order': r['order']
                }
            )
            if created:
                self.stdout.write(f"  Added Region: {r['label']}")

        # 3. Roles
        roles = [
            {'label': 'Engineering', 'value': 'Engineering', 'icon': 'Code2', 'order': 1},
            {'label': 'Design', 'value': 'Design', 'icon': 'Laptop', 'order': 2},
            {'label': 'Marketing', 'value': 'Marketing', 'icon': 'Rocket', 'order': 3},
            {'label': 'Product', 'value': 'Product', 'icon': 'Briefcase', 'order': 4},
            {'label': 'Sales', 'value': 'Sales', 'icon': 'Globe', 'order': 5},
        ]
        
        for r in roles:
            obj, created = HomePageRole.objects.get_or_create(
                config=config,
                value=r['value'],
                defaults={
                    'label': r['label'],
                    'icon_name': r['icon'],
                    'order': r['order']
                }
            )
            if created:
                self.stdout.write(f"  Added Role: {r['label']}")

        # 4. Footer Links
        links = [
            # Platform
            {'section': 'platform', 'label': 'Browse Jobs', 'url': '/jobs', 'order': 1},
            {'section': 'platform', 'label': 'Browse Companies', 'url': '/companies', 'order': 2},
            {'section': 'platform', 'label': 'Pricing', 'url': '/pricing', 'order': 3},
            # Support
            {'section': 'support', 'label': 'Help Center', 'url': '/help', 'order': 1},
            {'section': 'support', 'label': 'Contact Us', 'url': '/contact', 'order': 2},
            {'section': 'support', 'label': 'Terms of Service', 'url': '/terms', 'order': 3},
        ]
        
        for l in links:
            obj, created = FooterLink.objects.get_or_create(
                config=config,
                section=l['section'],
                label=l['label'],
                defaults={
                    'url': l['url'],
                    'order': l['order']
                }
            )
            if created:
                self.stdout.write(f"  Added Footer Link: {l['label']}")

        self.stdout.write(self.style.SUCCESS("Population complete!"))
