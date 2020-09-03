from rest_framework import serializers
from .models import StationMeta

class StationMetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = StationMeta
        fields = "__all__"
        depth = 1
