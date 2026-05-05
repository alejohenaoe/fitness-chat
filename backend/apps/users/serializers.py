from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = "__all__"
        read_only_fields = ("user",)


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "first_name", "email", "profile")


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    age = serializers.IntegerField(default=30)
    gender = serializers.CharField(default="other")
    weight_kg = serializers.FloatField(default=70)
    height_cm = serializers.FloatField(default=170)
    goal = serializers.CharField(default="maintenance")
    activity_level = serializers.CharField(default="moderate")

    def create(self, validated_data):
        email = validated_data["email"]
        user = User.objects.create_user(
            username=email,
            email=email,
            first_name=validated_data["name"],
            password=validated_data["password"],
        )
        profile = UserProfile.objects.create(
            user=user,
            age=validated_data["age"],
            gender=validated_data["gender"],
            weight_kg=validated_data["weight_kg"],
            height_cm=validated_data["height_cm"],
            goal=validated_data["goal"],
            activity_level=validated_data["activity_level"],
        )
        profile.daily_calorie_target = profile.calculate_tdee()
        profile.save()
        return user
