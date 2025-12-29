"""
URL configuration for remotehive_admin project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path
from django.views.generic.base import RedirectView
from core.views import api_docs_view, proxy_openapi, dashboard_stats_api, home_page_config_api, create_support_ticket, taxonomy_api, seo_config_api, company_categories_api

urlpatterns = [
    path("", RedirectView.as_view(url="admin/", permanent=False)),
    path("admin/api/docs/", api_docs_view, name="api_docs"),
    path("admin/api/schema/", proxy_openapi, name="api_schema_proxy"),
    path("admin/api/dashboard-stats/", dashboard_stats_api, name="dashboard_stats_api"),
    path("api/home-config/", home_page_config_api, name="home_page_config_api"),
    path("api/seo-config/", seo_config_api, name="seo_config_api"),
    path("api/company-categories/", company_categories_api, name="company_categories_api"),
    path("api/support-ticket/", create_support_ticket, name="create_support_ticket"),
    path("api/taxonomy/", taxonomy_api, name="taxonomy_api"),
    path("admin/", admin.site.urls),
]
