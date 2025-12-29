from django.db import models
from django.utils.html import format_html

class ScraperSource(models.Model):
    name = models.CharField(max_length=255)
    url = models.URLField()
    is_active = models.BooleanField(default=True)
    last_scraped = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

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
    company = models.CharField(max_length=255)
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
        return f"{self.title} at {self.company}"

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
