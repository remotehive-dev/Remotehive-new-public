from django.contrib import admin
from .models import AdCampaign, AdPlacement, MarketingIntegration

@admin.register(AdCampaign)
class AdCampaignAdmin(admin.ModelAdmin):
    list_display = ('name', 'client_name', 'start_date', 'end_date', 'is_active')
    list_filter = ('is_active',)

@admin.register(AdPlacement)
class AdPlacementAdmin(admin.ModelAdmin):
    list_display = ('campaign', 'location', 'impressions', 'clicks')
    list_filter = ('location',)

@admin.register(MarketingIntegration)
class MarketingIntegrationAdmin(admin.ModelAdmin):
    list_display = ('name', 'provider', 'pixel_id', 'is_active')
    list_filter = ('provider', 'is_active')
    search_fields = ('name', 'pixel_id')
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'provider', 'is_active')
        }),
        ('Configuration', {
            'fields': ('pixel_id', 'access_token'),
            'description': 'Enter the Pixel ID for automatic injection, or Access Token for server-side events.'
        }),
        ('Custom Script', {
            'fields': ('script_content',),
            'classes': ('collapse',),
            'description': 'Paste full script tags here if you need advanced customization (overrides Pixel ID).'
        }),
    )
