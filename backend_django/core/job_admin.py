from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .job_models import Job

class JobSourceFilter(admin.SimpleListFilter):
    title = 'Posted By'
    parameter_name = 'source'

    def lookups(self, request, model_admin):
        return (
            ('admin', 'Admin Panel'),
            ('employer', 'Employer'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'admin':
            return queryset.filter(posted_by__is_superuser=True)
        if self.value() == 'employer':
            return queryset.filter(posted_by__profile__role='employer')
        return queryset

class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'company', 'posted_by_badge', 'status_badge', 'job_type', 'views_count', 'applications_count', 'quick_view_action')
    list_filter = (JobSourceFilter, 'status', 'job_type', 'created_at')
    search_fields = ('title', 'company', 'description', 'posted_by__username')
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ('views_count', 'applications_count', 'created_at', 'updated_at', 'expires_at')
    
    fieldsets = (
        ('Overview', {
            'fields': ('title', 'slug', 'status', 'posted_by')
        }),
        ('Company Info', {
            'fields': ('company', 'company_logo', 'location')
        }),
        ('Job Details', {
            'fields': ('job_type', 'salary_range', 'description', 'requirements', 'benefits')
        }),
        ('Statistics', {
            'fields': ('views_count', 'applications_count', 'created_at', 'updated_at', 'expires_at')
        }),
    )
    
    actions = ['publish_jobs', 'close_jobs']

    def posted_by_badge(self, obj):
        role = "User"
        color = "gray"
        
        if obj.posted_by.is_superuser:
            role = "Admin"
            color = "purple"
        elif hasattr(obj.posted_by, 'profile'):
            if obj.posted_by.profile.role == 'employer':
                role = "Employer"
                color = "blue"
            elif obj.posted_by.profile.role == 'jobseeker':
                role = "Job Seeker"
                color = "green"
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px;">{}</span>',
            color, role
        )
    posted_by_badge.short_description = "Source"

    def quick_view_action(self, obj):
        return format_html(
            '<a class="button" href="{}" onclick="return showRelatedObjectLookupPopup(this);">View Details</a>',
            reverse('admin:core_job_change', args=[obj.id])
        )
    quick_view_action.short_description = "Actions"

    def publish_jobs(self, request, queryset):
        queryset.update(status='published')
        self.message_user(request, "Selected jobs have been published.")
    publish_jobs.short_description = "Publish selected jobs"

    def close_jobs(self, request, queryset):
        queryset.update(status='closed')
        self.message_user(request, "Selected jobs have been closed.")
    close_jobs.short_description = "Close selected jobs"

admin.site.register(Job, JobAdmin)
