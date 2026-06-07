from django.contrib import admin
from .models import *

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "phone_number", "token_credits", "user_token")
    list_filter = ("is_active", "is_staff", "is_superuser")
    search_fields = ("username", "email", "phone_number")
    ordering = ("username",)

@admin.register(TokenHistory)
class TokenHistoryAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "credit_token", "recharge_id", "created_at")
    list_filter = ("user", "created_at")
    search_fields = ("user__username", "recharge_id")
    ordering = ("-created_at",)

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "title", "is_deleted", "created_at")
    list_filter = ("user", "created_at")
    search_fields = ("user__username", "title")
    ordering = ("-created_at",)

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "conversation", "role", "text", "embedding", "created_at")
    list_filter = ("conversation", "role", "created_at")
    search_fields = ("conversation__title", "text")
    ordering = ("-created_at",)

@admin.register(UserMemory)
class UserMemoryAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "key", "value", "updated_at")
    list_filter = ("user", "updated_at")
    search_fields = ("user__username", "key")
    ordering = ("-updated_at",)