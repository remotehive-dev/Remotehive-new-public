from django.db import models

class AdCampaign(models.Model):
    name = models.CharField(max_length=255)
    client_name = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class AdPlacement(models.Model):
    campaign = models.ForeignKey(AdCampaign, on_delete=models.CASCADE)
    location = models.CharField(max_length=50, help_text="Where this ad appears (e.g. 'homepage_top')")
    image_url = models.URLField()
    target_url = models.URLField()
    impressions = models.IntegerField(default=0)
    clicks = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.campaign.name} - {self.location}"

class MarketingIntegration(models.Model):
    """
    Configuration for External Ad Providers and Marketing Pixels
    """
    PROVIDER_CHOICES = (
        ('meta', 'Meta Ads (Facebook/Instagram)'),
        ('google_ads', 'Google Ads'),
        ('google_analytics', 'Google Analytics'),
        ('linkedin', 'LinkedIn Ads'),
        ('twitter', 'X (Twitter) Ads'),
        ('tiktok', 'TikTok Ads'),
        ('ott_generic', 'OTT Player (Generic)'),
        ('custom', 'Custom Provider'),
    )
    
    name = models.CharField(max_length=100, help_text="Internal identifier")
    provider = models.CharField(max_length=50, choices=PROVIDER_CHOICES, default='custom')
    pixel_id = models.CharField(max_length=255, blank=True, null=True, help_text="Pixel ID / Tracking ID / Container ID")
    access_token = models.CharField(max_length=500, blank=True, null=True, help_text="API Access Token (for Server-Side API)")
    script_content = models.TextField(blank=True, null=True, help_text="Custom Script/Tag Content (overrides automatic pixel injection)")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.get_provider_display()} - {self.name}"

    class Meta:
        verbose_name = "Marketing Integration"
        verbose_name_plural = "Marketing Integrations"
