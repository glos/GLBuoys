from django.contrib.gis import admin 
from .models import Contact, Sponsor, Lake, StationMeta
from django.contrib.gis import forms
from django.contrib.gis.db import models

@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    pass

@admin.register(Sponsor)
class SponsorAdmin(admin.ModelAdmin):
    pass

@admin.register(Lake)
class LakeAdmin(admin.GeoModelAdmin):
    pass

class StationLocationForm(forms.ModelForm):
    point_location = forms.PointField(widget=forms.OSMWidget(
                                     attrs={ 'display_raw': True}))

@admin.register(StationMeta)
class StationMetaAdmin(admin.GeoModelAdmin):
    form = StationLocationForm
