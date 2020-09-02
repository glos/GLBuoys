"""
Definition of models.
"""

from django.contrib.gis.db import models

class Contact(models.Model):
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField()

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

class Sponsor(models.Model):
     organization_name = models.CharField(max_length=255, unique=True)
     logo_path = models.ImageField(upload_to="img")
     url = models.URLField(max_length=512, blank=True)

     def __str__(self):
        return self.organization_name

class Lake(models.Model):
    name = models.CharField(max_length=256, unique=True)
    geom = models.PolygonField()

    def __str__(self):
        return self.name

class StationMeta(models.Model):
    point_location = models.PointField()
    name = models.CharField(max_length=256, unique=True)
    long_name = models.CharField(max_length=256, blank=True)
    recovered = models.BooleanField()
    buoy_info = models.TextField()
    contact = models.ManyToManyField(Contact)
    alternate_id = models.CharField(max_length=256, unique=True, null=True)
    lake_override = models.ForeignKey(Lake, null=True)
    buoy_alert = models.CharField(max_length=256, blank=True)
    meta_glos = models.URLField(max_length=512, blank=True)
    sponsor_info = models.ManyToManyField(Sponsor)

    wq_only = models.BooleanField()
    wq_and_wx = models.BooleanField()
    buoy_owner = models.CharField(max_length=256)
    sofar_spotter_id = models.CharField(max_length=256, blank=True)
    uglos_link = models.BooleanField()
    webcam_link = models.URLField(max_length=512, blank=True)

    def __str__(self):
        return self.long_name or self.name

    class Meta:
        verbose_name = verbose_name_plural = "station metadata"
