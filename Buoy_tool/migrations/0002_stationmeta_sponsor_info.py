# -*- coding: utf-8 -*-
# Generated by Django 1.11.5 on 2020-09-01 22:33
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Buoy_tool', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='stationmeta',
            name='sponsor_info',
            field=models.ManyToManyField(to='Buoy_tool.Sponsor'),
        ),
    ]
