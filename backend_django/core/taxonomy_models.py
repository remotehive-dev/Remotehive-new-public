from django.db import models

class JobFamily(models.Model):
    """
    Macro Category: White Collar, Blue Collar, Grey Collar
    """
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name_plural = "Job Families"
        ordering = ['order', 'name']

    def __str__(self):
        return self.name

class JobCategory(models.Model):
    """
    Industry/Sector: IT, Finance, Healthcare, etc.
    """
    family = models.ForeignKey(JobFamily, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name_plural = "Job Categories"
        ordering = ['order', 'name']

    def __str__(self):
        return f"{self.name} ({self.family.name})"

class JobRole(models.Model):
    """
    Specific Role: Backend Developer, Accountant, etc.
    """
    category = models.ForeignKey(JobCategory, on_delete=models.CASCADE, related_name='roles')
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    is_remote_friendly = models.BooleanField(default=False)
    
    # Metadata Fields for Job Matching
    seniority_level = models.CharField(max_length=100, blank=True, null=True, help_text="e.g. Mid, Senior")
    typical_skills = models.TextField(blank=True, null=True, help_text="Comma-separated skills")
    kpis = models.TextField(blank=True, null=True, help_text="Key Performance Indicators")
    employment_type = models.CharField(max_length=50, blank=True, null=True, help_text="e.g. Full-time, Contract")
    remote_type_guidance = models.CharField(max_length=100, blank=True, null=True, help_text="e.g. Fully remote, Remote-first")
    
    class Meta:
        verbose_name_plural = "Job Roles"
        ordering = ['name']

    def __str__(self):
        return self.name
