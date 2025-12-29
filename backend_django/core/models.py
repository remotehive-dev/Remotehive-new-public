from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from .job_models import Job

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
