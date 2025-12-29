from django.core.management.base import BaseCommand
from autoscraper.models import ScrapedJob
from autoscraper.content_extractor import extract_job_details
import time

class Command(BaseCommand):
    help = 'Enriches scraped jobs with full details from the source URL'

    def handle(self, *args, **options):
        self.stdout.write("Starting job enrichment process...")
        
        # Find jobs that are 'new' and have poor descriptions
        # (Assuming generic "No description provided" or very short)
        jobs_to_enrich = ScrapedJob.objects.filter(status='new')
        
        count = 0
        total = jobs_to_enrich.count()
        
        self.stdout.write(f"Found {total} candidate jobs for enrichment.")
        
        for job in jobs_to_enrich:
            # Check if needs enrichment
            if job.description and len(job.description) > 100 and "No description" not in job.description:
                continue
                
            self.stdout.write(f"[{count+1}/{total}] Enriching: {job.title}...")
            
            try:
                details = extract_job_details(job.url)
                
                updated = False
                if details.get('description') and not details.get('error'):
                    job.description = details['description']
                    updated = True
                
                if details.get('salary_range'):
                    job.salary_range = details['salary_range']
                    updated = True
                    
                if details.get('job_type'):
                    job.job_type = details['job_type']
                    updated = True
                    
                if updated:
                    job.save()
                    self.stdout.write(self.style.SUCCESS(f"  -> Updated."))
                else:
                    self.stdout.write(self.style.WARNING(f"  -> No better data found. Error: {details.get('error')}"))
                
                # Sleep briefly to avoid rate limiting
                time.sleep(2)
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  -> Failed: {e}"))
            
            count += 1
            
        self.stdout.write(self.style.SUCCESS("Enrichment complete."))
