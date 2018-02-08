"""
Definition of urls for GLOS_buoy_tools.
"""

from datetime import datetime
from django.conf.urls import url
import django.contrib.auth.views

# Main buoy tool app:
from Buoy_tool.views import buoy
import Buoy_tool.forms
#from Buoy_tool import views

# Plotting & export app:
from Plotter_export_tools.views import plotter, plotter_get, getTSData, export, download_data

# Uncomment the next lines to enable the admin:
# from django.conf.urls import include
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = [
    # Home page:
    url(r'^$', plotter, name='plotter'),
    url(r'^export', export, name='export'),

    # url(r'^$', Buoy_tool.views.home, name='home'),

    # AJAX URLs:
    url(r'^ajax/getTSData$', getTSData, name='getTSData'),
    #url(r'^ajax/getBuoyMeta$', Buoy_tool.views.getBuoyMeta, name='getBuoyMeta'),
    
    # Data download call back
    url(r'download_data$', download_data, name='download_data'),

    # Plotter URLs:
    url(r'^plotter/$', plotter_get, name='plotter_get'),
    url(r'^plotter', plotter, name='plotter'),

    # Buoy page URLs:
    url(r'^buoy/([^/]+)/$', buoy, name='buoy'),
    url(r'^([^/]+)/$', buoy, name='buoy'),

    # Login/logout:
    
    #url(r'^login/$',
    #    django.contrib.auth.views.login,
    #    {
    #        'template_name': 'app/login.html',
    #        'authentication_form': app.forms.BootstrapAuthenticationForm,
    #        'extra_context':
    #        {
    #            'title': 'Log in',
    #            'year': datetime.now().year,
    #        }
    #    },
    #    name='login'),

    #url(r'^logout$',
    #    django.contrib.auth.views.logout,
    #    {
    #        'next_page': '/',
    #    },
    #    name='logout'),
    

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
]
