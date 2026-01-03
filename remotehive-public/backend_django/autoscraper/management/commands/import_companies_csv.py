import csv
import os
from django.core.management.base import BaseCommand
from autoscraper.models import Company, ScheduledTask

class Command(BaseCommand):
    help = 'Imports companies from a CSV file and adds them to the scraper engine.'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Path to the CSV file')

    def handle(self, *args, **options):
        csv_file_path = options['csv_file']
        
        if not os.path.exists(csv_file_path):
            self.stdout.write(self.style.ERROR(f'File not found: {csv_file_path}'))
            return

        self.stdout.write(f"Importing companies from {csv_file_path}...")
        
        # Get or create the scraper task to add companies to
        scraper_task, _ = ScheduledTask.objects.get_or_create(
            name='scrape_companies',
            defaults={'interval_minutes': 60, 'is_active': False}
        )

        added_count = 0
        updated_count = 0
        skipped_count = 0
        
        with open(csv_file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = row.get('Name', '').strip()
                website = row.get('Website', '').strip()
                region = row.get('Region', '').strip()
                
                if not name:
                    continue
                
                try:
                    company, created = Company.objects.get_or_create(name=name)
                    
                    # Update fields
                    company.website = website
                    if region:
                        # Append region to description if not present
                        current_desc = company.description or ""
                        if f"Region: {region}" not in current_desc:
                            company.description = f"{current_desc}\nRegion: {region}".strip()
                    
                    # Extract domain from website for logo fetching
                    if website and not company.domain:
                        from urllib.parse import urlparse
                        try:
                            domain = urlparse(website).netloc.replace('www.', '')
                            company.domain = domain
                        except:
                            pass
                            
                    company.save()
                    
                    # Add to scraper task
                    scraper_task.target_companies.add(company)
                    
                    if created:
                        added_count += 1
                        self.stdout.write(f"  Created: {name}")
                    else:
                        updated_count += 1
                        # self.stdout.write(f"  Updated: {name}")
                        
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"  Error processing {name}: {e}"))
                    skipped_count += 1

        self.stdout.write(self.style.SUCCESS(f"Import complete."))
        self.stdout.write(f"  Added: {added_count}")
        self.stdout.write(f"  Updated: {updated_count}")
        self.stdout.write(f"  Errors: {skipped_count}")
        self.stdout.write(f"  Total companies now in Scraper Engine: {scraper_task.target_companies.count()}")
