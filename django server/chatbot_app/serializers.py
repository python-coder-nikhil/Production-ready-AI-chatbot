from rest_framework import serializers
from .models import *
from django.contrib.auth import authenticate, get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests
from dotenv import load_dotenv
import os

load_dotenv()

User = get_user_model()


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "role", "text", "created_at"]


class ConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ("id", "title", "created_at")


class CreateConversationSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(
        read_only=False, queryset=User.objects.all()
    )

    class Meta:
        model = Conversation
        fields = ["id", "title", "created_at", "user"]


class MessageCreateSerializer(serializers.ModelSerializer):
    conversation_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Message
        fields = ["conversation_id", "role", "text"]

    def create(self, validated_data):
        conversation_id = validated_data.pop("conversation_id")

        try:
            conversation = Conversation.objects.get(id=conversation_id)
        except Conversation.DoesNotExist:
            raise serializers.ValidationError("Conversation not found")

        return Message.objects.create(conversation=conversation, **validated_data)


class LoginSerializer(serializers.Serializer):
    method = serializers.CharField(required=True)
    email = serializers.CharField(required=False)
    password = serializers.CharField(required=False)
    token = serializers.CharField(required=False)

    def validate(self, attrs):
        method = attrs.get("method")
        if method == "password":
            email = attrs.get("email")
            password = attrs.get("password")

            if not email or not password:
                raise serializers.ValidationError("Email and password are required")

            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                raise serializers.ValidationError("Invalid email or password")

            if not user.check_password(password):
                raise serializers.ValidationError("Invalid email or password")

        elif method == "google":
            token = attrs.get("token")
            if not token:
                raise serializers.ValidationError("Google token is required")

            try:
                idinfo = id_token.verify_oauth2_token(
                    token,
                    requests.Request(),
                    os.getenv("GOOGLE_CLIENT_ID"),
                )

                email = idinfo.get("email")
                name = idinfo.get("name", "")

                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        "username": email,
                        "first_name": name.split(" ")[0],
                        "last_name": (
                            " ".join(name.split(" ")[1:]) if " " in name else ""
                        ),
                    },
                )

            except Exception as e:
                raise serializers.ValidationError(f"Invalid Google token")

        else:
            raise serializers.ValidationError("Invalid login method")

        attrs["user"] = user
        return attrs

    def create(self, validated_data):
        user = validated_data["user"]
        refresh = RefreshToken.for_user(user)

        return {
            "status": int(os.getenv("SUCCESS", 1)),
            "message": "Login successful",
            "data": {
                "uuid": str(user.uuid),
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
            },
        }


class SearchMessageSerializer(serializers.ModelSerializer):
    conversation_id = serializers.UUIDField(source="conversation.id", read_only=True)
    conversation_title = serializers.CharField(
        source="conversation.title", read_only=True
    )

    class Meta:
        model = Message
        fields = [
            "id",
            "conversation_id",
            "conversation_title",
            "text",
            "role",
            "created_at",
        ]
