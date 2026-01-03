from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django import forms
from django.core.exceptions import ValidationError
from django.utils.html import format_html
from django.contrib import messages
import re
from .models import UserProfile, EmployerUser, JobSeekerUser, AdminUser, APIConfiguration, HomePageConfiguration, HomePageRole, HomePageRegion, SupportTicket, FooterLink, SEOPage, SEOTag
from autoscraper.services import test_api_connection

@admin.register(SEOPage)
class SEOPageAdmin(admin.ModelAdmin):
    list_display = ('path', 'title', 'is_active', 'updated_at')
    search_fields = ('path', 'title', 'description')
    list_filter = ('is_active',)
    fieldsets = (
        ('Page Info', {
            'fields': ('path', 'is_active')
        }),
        ('Meta Data', {
            'fields': ('title', 'description', 'keywords', 'canonical_url', 'og_image')
        }),
    )

@admin.register(SEOTag)
class SEOTagAdmin(admin.ModelAdmin):
    list_display = ('name', 'location', 'order', 'is_active')
    list_filter = ('location', 'is_active')
    search_fields = ('name', 'content')
    ordering = ('location', 'order')
    fieldsets = (
        ('Tag Config', {
            'fields': ('name', 'location', 'order', 'is_active')
        }),
        ('Content', {
            'fields': ('content',),
            'description': "Enter the raw HTML for the tag (e.g. &lt;script&gt;...&lt;/script&gt;)."
        }),
    )

# ... (UserProfileInline, UserAdmin, etc. unchanged)

@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ('id', 'subject', 'email', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('subject', 'email', 'message', 'id')
    readonly_fields = ('name', 'email', 'subject', 'message', 'created_at')
    fieldsets = (
        ('Ticket Details', {
            'fields': ('created_at', 'status')
        }),
        ('User Info', {
            'fields': ('name', 'email')
        }),
        ('Content', {
            'fields': ('subject', 'message')
        }),
        ('Admin Action', {
            'fields': ('admin_reply',),
            'description': "Entering text here and saving will send an email reply to the user."
        }),
    )

    def save_model(self, request, obj, form, change):
        # Check if admin_reply has changed
        if 'admin_reply' in form.changed_data and obj.admin_reply:
            # Send Email Logic
            from django.core.mail import send_mail
            from django.conf import settings
            
            try:
                send_mail(
                    subject=f"Re: {obj.subject} [Ticket #{obj.id}]",
                    message=obj.admin_reply,
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'support@remotehive.in'),
                    recipient_list=[obj.email],
                    fail_silently=False,
                )
                self.message_user(request, f"Reply sent successfully to {obj.email}.", level=messages.SUCCESS)
                
                # Auto update status if open
                if obj.status == 'open':
                    obj.status = 'resolved'
                    
            except Exception as e:
                self.message_user(request, f"Failed to send email: {str(e)}", level=messages.ERROR)
        
        super().save_model(request, obj, form, change)

class FooterLinkInline(admin.TabularInline):
    model = FooterLink
    extra = 1
    fields = ('section', 'label', 'url', 'order')

class HomePageRoleInline(admin.TabularInline):
    model = HomePageRole
    extra = 1
    fields = ('label', 'value', 'icon_name', 'order', 'is_active')

class HomePageRegionInline(admin.TabularInline):
    model = HomePageRegion
    extra = 1
    fields = ('label', 'value', 'icon_emoji', 'order', 'is_active')

@admin.register(HomePageConfiguration)
class HomePageConfigurationAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'active_jobs_count', 'companies_count', 'updated_at')
    inlines = [HomePageRoleInline, HomePageRegionInline, FooterLinkInline]
    
    fieldsets = (
        ('Hero Section', {
            'fields': ('hero_title', 'hero_subtitle', 'search_placeholder'),
            'description': "Controls the main banner text and search bar."
        }),
        ('Statistics Section', {
            'fields': ('active_jobs_count', 'companies_count', 'success_rate', 'countries_count'),
            'description': "Updates the 4 key metrics shown on the home page."
        }),
        ('Footer Content', {
            'fields': ('footer_description', 'footer_email', 'footer_phone', 'footer_address', 'footer_copyright'),
            'description': "Manage the footer text and contact details."
        }),
    )

    def has_add_permission(self, request):
        # Limit to 1 instance
        if self.model.objects.exists():
            return False
        return super().has_add_permission(request)

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

# Register Taxonomy
from .taxonomy_models import JobFamily, JobCategory, JobRole

@admin.register(JobFamily)
class JobFamilyAdmin(admin.ModelAdmin):
    list_display = ('name', 'order')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(JobCategory)
class JobCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'family', 'order')
    list_filter = ('family',)
    prepopulated_fields = {'slug': ('name',)}

@admin.register(JobRole)
class JobRoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'is_remote_friendly')
    list_filter = ('category__family', 'category', 'is_remote_friendly')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}

# Register Job Admin
from .job_admin import JobAdmin

class APIConfigurationAdminForm(forms.ModelForm):
    service_name = forms.CharField(
        max_length=50,
        help_text="Use a short key like 'serp', 'rapidapi', 'linkedin', or your own (lowercase).",
        widget=forms.TextInput(attrs={"placeholder": "e.g. linkedin"}),
    )

    class Meta:
        model = APIConfiguration
        fields = "__all__"

    def clean_service_name(self):
        raw_value = (self.cleaned_data.get("service_name") or "").strip()
        normalized = raw_value.lower()
        normalized = re.sub(r"\s+", "_", normalized)
        normalized = re.sub(r"[^a-z0-9_-]", "", normalized)
        if not normalized:
            raise ValidationError("Service name is required.")
        if "linkedin" in normalized:
            return "linkedin"
        if normalized in {"serpapi", "serp_api"} or "serp" == normalized:
            return "serp"
        if normalized in {"rapid", "rapid_api"} or "rapid" in normalized:
            return "rapidapi"
        if "openweb" in normalized or "ninja" in normalized or "jsearch" in normalized:
            return "openwebninja"
        return normalized

@admin.register(APIConfiguration)
class APIConfigurationAdmin(admin.ModelAdmin):
    form = APIConfigurationAdminForm
    list_display = ('service_name', 'is_active', 'updated_at', 'test_connection_btn')
    list_filter = ('service_name', 'is_active')
    search_fields = ('service_name',)
    fieldsets = (
        ('Service Details', {
            'fields': ('service_name', 'is_active')
        }),
        ('Credentials', {
            'fields': ('api_key', 'base_url'),
            'description': "Enter the API key and optional base URL provided by the service provider."
        }),
    )
    actions = ['test_connection_action']

    def test_connection_btn(self, obj):
        return format_html(
            '<a class="button" href="test-connection/{}/">Test Connection</a>',
            obj.id
        )
    test_connection_btn.short_description = "Action"
    test_connection_btn.allow_tags = True

    def test_connection_action(self, request, queryset):
        for config in queryset:
            success, message = test_api_connection(config.service_name)
            if success:
                self.message_user(request, f"{config.service_name}: {message}", level=messages.SUCCESS)
            else:
                self.message_user(request, f"{config.service_name}: {message}", level=messages.ERROR)
    test_connection_action.short_description = "Test Connection for Selected APIs"

    # Add custom URL for the button (optional, but cleaner)
    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path('test-connection/<int:pk>/', self.admin_site.admin_view(self.test_connection_view), name='api-test-connection'),
        ]
        return custom_urls + urls

    def test_connection_view(self, request, pk):
        from django.shortcuts import get_object_or_404, redirect
        config = get_object_or_404(APIConfiguration, pk=pk)
        success, message = test_api_connection(config.service_name)
        
        if success:
            self.message_user(request, f"{config.service_name}: {message}", level=messages.SUCCESS)
        else:
            self.message_user(request, f"{config.service_name}: {message}", level=messages.ERROR)
            
        return redirect(request.META.get('HTTP_REFERER', 'admin:core_apiconfiguration_changelist'))
