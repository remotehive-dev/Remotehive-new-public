from django.db import models
from django.utils.html import format_html

class Country(models.Model):
    """ISO 3166-1 Country Reference"""
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=2, unique=True, help_text="ISO 3166-1 alpha-2 code")
    languages = models.CharField(max_length=255, blank=True, null=True, help_text="Comma-separated official languages")
    flag_emoji = models.CharField(max_length=10, blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.flag_emoji} {self.name}" if self.flag_emoji else self.name

    class Meta:
        verbose_name_plural = "Countries"
        ordering = ['name']

class CompanyCategory(models.Model):
    """
    Categories for grouping companies (e.g., MNC, Edtech, Unicorn)
    """
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True, null=True, help_text="Lucide icon name or emoji")
    description = models.TextField(blank=True, null=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subcategories')
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name_plural = "Company Categories"
        ordering = ['order', 'name']

    def __str__(self):
        return f"{self.parent.name} > {self.name}" if self.parent else self.name

class Company(models.Model):
    """Centralized company information with logo"""
    name = models.CharField(max_length=255, unique=True, db_index=True)
    domain = models.CharField(max_length=255, blank=True, null=True, help_text="Company domain for logo fetch")
    logo_url = models.URLField(max_length=500, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    
    # Location
    country = models.ForeignKey(Country, on_delete=models.SET_NULL, null=True, blank=True, related_name='companies')
    
    # Enrichment Data
    linkedin_url = models.URLField(blank=True, null=True)
    twitter_url = models.URLField(blank=True, null=True)
    github_url = models.URLField(blank=True, null=True)
    industry = models.CharField(max_length=255, blank=True, null=True)
    employee_count = models.CharField(max_length=50, blank=True, null=True)
    founded_year = models.IntegerField(null=True, blank=True)
    
    # Logo fetching metadata
    logo_last_fetched = models.DateTimeField(null=True, blank=True)
    logo_fetch_failed = models.BooleanField(default=False, help_text="True if logo fetch failed")
    
    # Categorization
    categories = models.ManyToManyField(CompanyCategory, blank=True, related_name='companies')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Companies"
        ordering = ['name']

class CompanyScrapeProfile(models.Model):
    """
    Configuration profile for controlling scraping behavior per company.
    Enforces strict domain boundaries and discovery strategies.
    """
    DISCOVERY_STRATEGIES = [
        ('google_site_search', 'Google Site Search (site:domain.com)'),
        ('career_page_crawl', 'Career Page Crawl (Recursive)'),
        ('sitemap_xml', 'Sitemap.xml Parsing'),
        ('ats_direct', 'Known ATS Direct Path'),
    ]
    
    company = models.OneToOneField(Company, on_delete=models.CASCADE, related_name='scrape_profile')
    is_active = models.BooleanField(default=True)
    
    # 1. Domain Safety
    allowed_domains = models.JSONField(
        default=list, 
        help_text="List of strict allowed domains/subdomains (e.g. ['careers.airbnb.com', 'airbnb.com'])"
    )
    
    # 2. Strategy
    discovery_strategy = models.CharField(
        max_length=50, 
        choices=DISCOVERY_STRATEGIES, 
        default='google_site_search'
    )
    ats_root_url = models.URLField(blank=True, null=True, help_text="Direct URL to ATS if using ats_direct strategy")
    
    # 3. Technical Config
    render_required = models.BooleanField(default=False, help_text="Use Selenium/Playwright? (Slower, Costlier)")
    scrape_frequency_hours = models.IntegerField(default=24)
    
    # 4. State
    last_run_at = models.DateTimeField(null=True, blank=True)
    last_status = models.CharField(max_length=50, blank=True, null=True)
    
    def __str__(self):
        return f"Profile: {self.company.name}"

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
    apply_url = models.URLField(max_length=500, blank=True, null=True, help_text="Direct application link if different from source URL")
    
    # Detailed Fields
    requirements = models.TextField(blank=True, null=True)
    experience = models.CharField(max_length=100, blank=True, null=True, help_text="e.g. 3-5 years")
    
    # State Machine
    scrape_status = models.CharField(
        max_length=20, 
        choices=[
            ('discovered', 'Discovered'),
            ('fetched', 'Fetched'),
            ('parsed_partial', 'Parsed (Partial)'),
            ('parsed_failed', 'Parsed (Failed)'),
            ('approved', 'Approved'),
            ('rejected', 'Rejected')
        ],
        default='discovered'
    )
    retry_count = models.IntegerField(default=0)
    last_attempt_at = models.DateTimeField(null=True, blank=True)
    failure_reason = models.TextField(blank=True, null=True)
    
    # Deduplication Hash
    dedup_hash = models.CharField(max_length=64, unique=True, null=True, blank=True, help_text="hash(company_id + title + location)")

    # Taxonomy Linking
    job_role = models.ForeignKey('core.JobRole', on_delete=models.SET_NULL, null=True, blank=True, related_name='scraped_jobs')

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

class ScheduledTask(models.Model):
    TASK_CHOICES = [
        ('enrich_jobs', 'Enrich Scraped Jobs'),
        ('scrape_companies', 'Scrape Target Companies'),
        ('enrich_companies', 'Enrich Company Profiles'),
    ]
    
    name = models.CharField(max_length=100, choices=TASK_CHOICES, unique=True)
    interval_minutes = models.IntegerField(default=60, help_text="Run every X minutes")
    is_active = models.BooleanField(default=False)
    
    # Configuration for Scraper Task
    target_companies = models.ManyToManyField(Company, blank=True, help_text="Select companies to scrape for this task")
    target_job_roles = models.ManyToManyField('core.JobRole', blank=True, help_text="Specific roles to target (empty = all)")
    
    last_run_at = models.DateTimeField(null=True, blank=True)
    next_run_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        status = "Active" if self.is_active else "Inactive"
        return f"{self.get_name_display()} ({status}) - Every {self.interval_minutes}m"

class ScraperLog(models.Model):
    """Tracks the execution history and progress of scraper tasks"""
    STATUS_CHOICES = [
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('stopped', 'Stopped'),
    ]
    
    task = models.ForeignKey(ScheduledTask, on_delete=models.CASCADE, related_name='logs')
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='running')
    
    # Progress Metrics
    total_companies_target = models.IntegerField(default=0)
    companies_processed = models.IntegerField(default=0)
    jobs_found = models.IntegerField(default=0)
    current_company = models.CharField(max_length=255, blank=True, null=True, help_text="Currently scraping...")
    
    message = models.TextField(blank=True, null=True)

    def progress_percentage(self):
        if self.total_companies_target == 0:
            return 0
        return int((self.companies_processed / self.total_companies_target) * 100)

    class Meta:
        ordering = ['-start_time']

