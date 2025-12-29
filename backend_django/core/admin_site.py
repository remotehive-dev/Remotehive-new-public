from django.contrib import admin
from django.template.response import TemplateResponse
from django.urls import path
from .dashboard_stats import get_dashboard_stats

class RemoteHiveAdminSite(admin.AdminSite):
    site_header = "RemoteHive Administration"
    site_title = "RemoteHive Admin"
    index_title = "Dashboard"

    def index(self, request, extra_context=None):
        stats = get_dashboard_stats()
        extra_context = extra_context or {}
        extra_context['dashboard_stats'] = stats
        return super().index(request, extra_context=extra_context)

remotehive_admin_site = RemoteHiveAdminSite(name='remotehive_admin')
