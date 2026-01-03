from django.apps import AppConfig
import threading
import time
import logging

logger = logging.getLogger(__name__)

class AutoscraperConfig(AppConfig):
    name = "autoscraper"

    def ready(self):
        # Prevent running twice (e.g. autoreloader)
        import os
        if os.environ.get('RUN_MAIN') != 'true':
            return
            
        # Start Scheduler Thread
        scheduler_thread = threading.Thread(target=self.start_scheduler, daemon=True)
        scheduler_thread.start()
        
    def start_scheduler(self):
        from django.core.management import call_command
        from django.utils import timezone
        from .models import ScheduledTask
        import datetime
        
        logger.info("Scheduler started.")
        
        while True:
            try:
                # Check for tasks
                tasks = ScheduledTask.objects.filter(is_active=True)
                
                for task in tasks:
                    should_run = False
                    now = timezone.now()
                    
                    if not task.last_run_at:
                        should_run = True
                    else:
                        delta = now - task.last_run_at
                        if delta.total_seconds() / 60 >= task.interval_minutes:
                            should_run = True
                            
                    if should_run:
                        logger.info(f"Running scheduled task: {task.name}")
                        
                        if task.name == 'enrich_jobs':
                            call_command('enrich_jobs')
                            
                        task.last_run_at = now
                        # Calculate next run
                        task.next_run_at = now + datetime.timedelta(minutes=task.interval_minutes)
                        task.save()
                        
                # Sleep for 1 minute before next check
                time.sleep(60)
                
            except Exception as e:
                logger.error(f"Scheduler error: {e}")
                time.sleep(60)
