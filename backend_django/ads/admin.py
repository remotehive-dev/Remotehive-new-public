from django.contrib import admin
from .models import AdCampaign, AdPlacement

@admin.register(AdCampaign)
class AdCampaignAdmin(admin.ModelAdmin):
    list_display = ('name', 'client_name', 'start_date', 'end_date', 'is_active')
    list_filter = ('is_active',)

@admin.register(AdPlacement)
class AdPlacementAdmin(admin.ModelAdmin):
    list_display = ('campaign', 'location', 'impressions', 'clicks')
    list_filter = ('location',)
