from django.db import models
from django.contrib.auth.models import User
from django.utils.html import format_html

class Job(models.Model):
    JOB_STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('closed', 'Closed'),
        ('expired', 'Expired'),
    ]

    JOB_TYPE_CHOICES = [
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('contract', 'Contract'),
        ('internship', 'Internship'),
    ]

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    company = models.CharField(max_length=255)
    company_logo = models.URLField(blank=True, null=True)
    location = models.CharField(max_length=255)
    job_type = models.CharField(max_length=50, choices=JOB_TYPE_CHOICES, default='full_time')
    salary_range = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField()
    requirements = models.TextField(blank=True)
    benefits = models.TextField(blank=True)
    apply_url = models.URLField(blank=True, null=True, help_text="External link for application (if applicable)")
    
    # New Fields for Enhanced Features
    job_reference_id = models.CharField(max_length=20, unique=True, blank=True, null=True, help_text="Unique Reference ID e.g., RH-1234")
    application_method = models.CharField(
        max_length=20, 
        choices=[('external', 'External URL'), ('internal', 'On RemoteHive')],
        default='external'
    )
    
    # Taxonomy Linking
    job_role = models.ForeignKey('core.JobRole', on_delete=models.SET_NULL, null=True, blank=True, related_name='jobs')

    status = models.CharField(max_length=20, choices=JOB_STATUS_CHOICES, default='draft')

    def save(self, *args, **kwargs):
        if not self.job_reference_id:
            # Generate Unique ID
            import random
            import string
            while True:
                uid = 'RH-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
                if not Job.objects.filter(job_reference_id=uid).exists():
                    self.job_reference_id = uid
                    break
        super().save(*args, **kwargs)
    posted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posted_jobs')
    
    views_count = models.IntegerField(default=0)
    applications_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} at {self.company}"

    def status_badge(self):
        color = 'gray'
        if self.status == 'published': color = 'green'
        if self.status == 'draft': color = 'orange'
        if self.status == 'closed': color = 'red'
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 10px;">{}</span>',
            color, self.get_status_display()
        )
