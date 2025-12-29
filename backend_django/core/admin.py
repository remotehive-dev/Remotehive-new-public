from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import UserProfile, EmployerUser, JobSeekerUser, AdminUser

# Define an inline admin descriptor for UserProfile model
class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    readonly_fields = ('clerk_id', 'last_synced_at', 'auth_provider_badge')
    fieldsets = (
        ('Account Details', {
            'fields': ('role', 'company_name', 'phone')
        }),
        ('Authentication', {
            'fields': ('auth_provider_badge', 'clerk_id', 'last_synced_at')
        }),
        ('Subscription', {
            'fields': ('subscription_status', 'subscription_plan')
        }),
    )

    def auth_provider_badge(self, obj):
        provider = obj.auth_provider.lower()
        color = 'gray'
        icon = 'fa-envelope'
        
        if 'google' in provider:
            color = '#DB4437'
            icon = 'fa-google'
        elif 'linkedin' in provider:
            color = '#0077B5'
            icon = 'fa-linkedin'
        elif 'github' in provider:
            color = 'black'
            icon = 'fa-github'
            
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 10px;">'
            '<i class="fab {}"></i> {}</span>',
            color, icon, obj.auth_provider
        )
    auth_provider_badge.short_description = "Auth Provider"

# Define a new User admin
class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)
    list_display = ('username', 'email', 'get_role', 'get_auth_provider', 'is_active_toggle', 'get_subscription_status')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'profile__role', 'profile__auth_provider', 'profile__subscription_status')
    actions = ['block_users', 'unblock_users', 'check_subscription_status']

    def get_role(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.get_role_display()
        return 'N/A'
    get_role.short_description = 'Role'

    def get_auth_provider(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.auth_provider
        return 'Unknown'
    get_auth_provider.short_description = 'Auth Provider'

    def is_active_toggle(self, obj):
        color = 'green' if obj.is_active else 'red'
        icon = 'fa-check-circle' if obj.is_active else 'fa-ban'
        return format_html(
            '<span style="color: {};"><i class="fas {}"></i> {}</span>',
            color, icon, "Active" if obj.is_active else "Blocked"
        )
    is_active_toggle.short_description = 'Status'

    def get_subscription_status(self, obj):
        if hasattr(obj, 'profile'):
            status = obj.profile.subscription_status
            color = 'orange'
            if status == 'active': color = 'green'
            if status == 'expired': color = 'red'
            
            return format_html(
                '<span style="color: {}; font-weight: bold;">{}</span>',
                color, status.upper()
            )
        return '-'
    get_subscription_status.short_description = 'Subscription'

    # --- Actions ---
    def block_users(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, "Selected users have been blocked.")
    block_users.short_description = "Block selected users"

    def unblock_users(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, "Selected users have been unblocked.")
    unblock_users.short_description = "Unblock selected users"

    def check_subscription_status(self, request, queryset):
        # In a real app, this would hit Stripe/PayPal API
        # For now, we simulate a check
        count = queryset.count()
        self.message_user(request, f"Subscription status checked for {count} users. (Mock)")
    check_subscription_status.short_description = "Check Subscription Status"

# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

# --- Proxy Admins for Specific Roles ---

class EmployerAdmin(UserAdmin):
    def get_queryset(self, request):
        return super().get_queryset(request).filter(profile__role='employer')
    
    def get_role(self, obj):
        return "Employer"

class JobSeekerAdmin(UserAdmin):
    def get_queryset(self, request):
        return super().get_queryset(request).filter(profile__role='jobseeker')

    def get_role(self, obj):
        return "Job Seeker"

class AdminUserAdmin(UserAdmin):
    def get_queryset(self, request):
        return super().get_queryset(request).filter(profile__role='admin')

    def get_role(self, obj):
        return "Admin"

admin.site.register(EmployerUser, EmployerAdmin)
admin.site.register(JobSeekerUser, JobSeekerAdmin)
admin.site.register(AdminUser, AdminUserAdmin)

# Register Job Admin
from .job_admin import JobAdmin

