from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from .job_models import Job
from .taxonomy_models import JobFamily, JobCategory, JobRole


class APIConfiguration(models.Model):
    SERVICE_LABELS = {
        "serp": "SERP API (Google Jobs)",
        "rapidapi": "RapidAPI (Active Jobs DB)",
        "linkedin": "RapidAPI (LinkedIn Job Search)",
        "openwebninja": "OpenWebNinja API (JSearch)",
        "google_custom": "Google Custom Search JSON API",
        "adzuna": "Adzuna Job Search API",
    }
    service_name = models.CharField(
        max_length=50,
        unique=True,
        help_text="Service key like 'serp', 'rapidapi', 'linkedin', 'openwebninja', 'adzuna' or a custom value",
    )
    api_key = models.CharField(max_length=255)
    base_url = models.URLField(blank=True, null=True, help_text="Optional base URL override")
    extra_config = models.JSONField(blank=True, null=True, default=dict, help_text="Additional JSON config (e.g. {'cx': '...'})")
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_service_name_display(self):
        return self.SERVICE_LABELS.get(self.service_name, self.service_name)

    def __str__(self):
        return self.get_service_name_display()

    class Meta:
        verbose_name = "API Key Configuration"
        verbose_name_plural = "API Key Configurations"

class HomePageConfiguration(models.Model):
    # Stats Section
    active_jobs_count = models.CharField(max_length=20, default="10k+", help_text="e.g. 10k+")
    companies_count = models.CharField(max_length=20, default="2.5k", help_text="e.g. 2.5k")
    success_rate = models.CharField(max_length=20, default="95%", help_text="e.g. 95%")
    countries_count = models.CharField(max_length=20, default="50+", help_text="e.g. 50+")
    
    # Hero Section
    hero_title = models.CharField(max_length=255, default="Find Your Dream Remote Job")
    hero_subtitle = models.TextField(default="Connect with top companies offering remote opportunities worldwide.")
    
    # Search Placeholders
    search_placeholder = models.CharField(max_length=100, default="Job title or keyword")
    
    # Footer Section
    footer_description = models.TextField(default="Connecting talented professionals with remote opportunities worldwide.")
    footer_email = models.EmailField(default="support@remotehive.in")
    footer_phone = models.CharField(max_length=20, default="+91-9667791765")
    footer_address = models.CharField(max_length=255, default="San Francisco, CA")
    footer_copyright = models.CharField(max_length=255, default="RemoteHive. All rights reserved.")

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Home Page Config (Last updated: {self.updated_at.strftime('%Y-%m-%d %H:%M')})"

    class Meta:
        verbose_name = "Home Page Configuration"
        verbose_name_plural = "Home Page Configuration"

class FooterLink(models.Model):
    SECTION_CHOICES = (
        ('platform', 'Platform'),
        ('support', 'Support'),
        ('legal', 'Legal'),
        ('social', 'Social Media'),
    )
    
    config = models.ForeignKey(HomePageConfiguration, on_delete=models.CASCADE, related_name='footer_links')
    section = models.CharField(max_length=20, choices=SECTION_CHOICES, default='platform')
    label = models.CharField(max_length=50)
    url = models.CharField(max_length=255, help_text="Relative path (e.g. /jobs) or full URL")
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['section', 'order']
        
    def __str__(self):
        return f"{self.get_section_display()} - {self.label}"

class HomePageRole(models.Model):
    config = models.ForeignKey(HomePageConfiguration, on_delete=models.CASCADE, related_name='roles')
    label = models.CharField(max_length=50, help_text="Display Name e.g. Engineering")
    value = models.CharField(max_length=50, help_text="Filter Value e.g. engineering")
    icon_name = models.CharField(max_length=50, help_text="Lucide Icon Name e.g. Code2, Briefcase")
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.label

class HomePageRegion(models.Model):
    config = models.ForeignKey(HomePageConfiguration, on_delete=models.CASCADE, related_name='regions')
    label = models.CharField(max_length=50, help_text="Display Name e.g. United States")
    value = models.CharField(max_length=50, help_text="Filter Value e.g. United States")
    icon_emoji = models.CharField(max_length=10, help_text="Emoji Flag e.g. 🇺🇸")
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.label

class UserProfile(models.Model):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('employer', 'Employer'),
        ('jobseeker', 'Job Seeker'),
    )
    
    SUBSCRIPTION_STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('expired', 'Expired'),
        ('trial', 'Trial'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='jobseeker')
    company_name = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    # New Fields
    auth_provider = models.CharField(max_length=50, default='email', help_text="e.g. Google, LinkedIn, Email")
    subscription_status = models.CharField(max_length=20, choices=SUBSCRIPTION_STATUS_CHOICES, default='inactive')
    subscription_plan = models.CharField(max_length=100, blank=True, null=True, default='Free Tier')
    clerk_id = models.CharField(max_length=100, blank=True, null=True)
    last_synced_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        # Default to jobseeker, but if superuser, make admin
        role = 'admin' if instance.is_superuser else 'jobseeker'
        UserProfile.objects.create(user=instance, role=role)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()
    else:
        # Create if missing (for existing users)
        role = 'admin' if instance.is_superuser else 'jobseeker'
        UserProfile.objects.create(user=instance, role=role)

# Proxy Models for Admin Separation
class EmployerUser(User):
    class Meta:
        proxy = True
        verbose_name = 'Employer'
        verbose_name_plural = 'Employers'

class JobSeekerUser(User):
    class Meta:
        proxy = True
        verbose_name = 'Job Seeker'
        verbose_name_plural = 'Job Seekers'

class AdminUser(User):
    class Meta:
        proxy = True
        verbose_name = 'Admin User'
        verbose_name_plural = 'Admin Users'

class SupportTicket(models.Model):
    STATUS_CHOICES = (
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    )

    name = models.CharField(max_length=100)
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    admin_reply = models.TextField(blank=True, null=True, help_text="Write your reply here. Saving with a reply will send an email.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Ticket #{self.id}: {self.subject} ({self.email})"

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Support Ticket"
        verbose_name_plural = "Support Tickets"

class SEOPage(models.Model):
    """
    Page-specific SEO Metadata
    """
    path = models.CharField(max_length=255, help_text="URL Path e.g. / or /jobs", unique=True)
    title = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    keywords = models.TextField(blank=True, null=True, help_text="Comma separated keywords")
    og_image = models.URLField(blank=True, null=True, help_text="OpenGraph Image URL")
    canonical_url = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.path} - {self.title}"

    class Meta:
        verbose_name = "SEO Page"
        verbose_name_plural = "SEO Pages"

class SEOTag(models.Model):
    """
    Custom Global Tags (Scripts, Verifications, etc.)
    """
    LOCATION_CHOICES = (
        ('head', 'Head (<head>)'),
        ('body_start', 'Body Start (<body>)'),
        ('body_end', 'Body End (</body>)'),
    )
    
    name = models.CharField(max_length=100, help_text="Internal identifier e.g. GTM")
    content = models.TextField(help_text="Full HTML tag e.g. <script>...</script>")
    location = models.CharField(max_length=20, choices=LOCATION_CHOICES, default='head')
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    
    def __str__(self):
        return f"{self.name} ({self.get_location_display()})"

    class Meta:
        ordering = ['location', 'order']
        verbose_name = "Custom SEO Tag"
        verbose_name_plural = "Custom SEO Tags"
