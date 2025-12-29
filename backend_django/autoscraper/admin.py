from django.contrib import admin
from .models import ScraperSource, ScrapedJob

@admin.register(ScraperSource)
class ScraperSourceAdmin(admin.ModelAdmin):
    list_display = ('name', 'url', 'is_active', 'last_scraped')
    list_filter = ('is_active',)

@admin.register(ScrapedJob)
class ScrapedJobAdmin(admin.ModelAdmin):
    list_display = ('title', 'company', 'source', 'posted_date', 'status_badge')
    search_fields = ('title', 'company')
    list_filter = ('source', 'is_remote', 'status', 'job_type')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Job Details', {
            'fields': ('title', 'company', 'location', 'description', 'url')
        }),
        ('Metadata', {
            'fields': ('source', 'posted_date', 'is_remote', 'salary_range', 'job_type')
        }),
        ('Management', {
            'fields': ('status', 'created_at', 'updated_at')
        }),
    )
    
    actions = ['approve_jobs', 'reject_jobs']

    def approve_jobs(self, request, queryset):
        queryset.update(status='approved')
        self.message_user(request, "Selected jobs have been approved.")
    approve_jobs.short_description = "Approve selected jobs"

    def reject_jobs(self, request, queryset):
        queryset.update(status='rejected')
        self.message_user(request, "Selected jobs have been rejected.")
    reject_jobs.short_description = "Reject selected jobs"
