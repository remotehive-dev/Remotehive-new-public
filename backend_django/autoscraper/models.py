from django.db import models
from django.utils.html import format_html

class Company(models.Model):
    """Centralized company information with logo"""
    name = models.CharField(max_length=255, unique=True, db_index=True)
    domain = models.CharField(max_length=255, blank=True, null=True, help_text="Company domain for logo fetch")
    logo_url = models.URLField(max_length=500, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    
    # Logo fetching metadata
    logo_last_fetched = models.DateTimeField(null=True, blank=True)
    logo_fetch_failed = models.BooleanField(default=False, help_text="True if logo fetch failed")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Companies"
        ordering = ['name']

class ScraperSource(models.Model):
    name = models.CharField(max_length=255)
    url = models.URLField()
    is_active = models.BooleanField(default=True)
    last_scraped = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class TargetCompany(models.Model):
    name = models.CharField(max_length=255)
    website = models.URLField(blank=True, null=True)
    logo_url = models.URLField(blank=True, null=True)
    region = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    last_scraped_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return self.name

class ScrapedJob(models.Model):
    STATUS_CHOICES = [
        ('new', 'New'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ]

    source = models.ForeignKey(ScraperSource, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    company = models.ForeignKey(Company, on_delete=models.SET_NULL, null=True, blank=True, related_name='jobs')
    company_text = models.CharField(max_length=255, default="Unknown", help_text="Backup company name from scraper")
    location = models.CharField(max_length=255)
    url = models.URLField()
    description = models.TextField()
    is_remote = models.BooleanField(default=True)
    posted_date = models.DateField(null=True, blank=True)
    
    # New Fields for Management
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    salary_range = models.CharField(max_length=100, blank=True, null=True)
    job_type = models.CharField(max_length=50, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        company_name = self.company.name if self.company else self.company_text
        return f"{self.title} at {company_name}"

    def status_badge(self):
        color = 'gray'
        if self.status == 'approved': color = 'green'
        if self.status == 'new': color = 'blue'
        if self.status == 'rejected': color = 'red'
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 10px;">{}</span>',
            color, self.get_status_display()
        )
    status_badge.short_description = 'Status'
