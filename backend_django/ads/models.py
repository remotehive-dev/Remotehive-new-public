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
