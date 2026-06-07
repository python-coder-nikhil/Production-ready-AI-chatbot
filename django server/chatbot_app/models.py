from django.db import models
from django.contrib.auth.models import AbstractUser
from uuid import uuid4
from pgvector.django import VectorField


# =====================
# USER & TOKENS
# =====================
class CustomUser(AbstractUser):
    uuid = models.UUIDField(default=uuid4, editable=False, unique=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    token_credits = models.IntegerField(default=0)
    user_token = models.CharField(max_length=255, blank=True, null=True)
    date_joined = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "custom_user"

    def __str__(self):
        return self.username


class TokenHistory(models.Model):
    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="token_history"
    )
    credit_token = models.IntegerField(default=0)
    recharge_id = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "token_history"

    def __str__(self):
        return f"{self.user.username} - {self.credit_token}"


# =====================
# CONVERSATIONS & MESSAGES
# =====================
class Conversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="conversations",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=255)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "conversation"

    def __str__(self):
        return f"{self.title} (User: {self.user.username if self.user else 'Unknown'})"


class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages", null=True
    )
    role = models.CharField(
        max_length=10, choices=[("user", "User"), ("assistant", "Assistant")], null=True
    )
    text = models.TextField()
    embedding = VectorField(dimensions=384, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["conversation", "created_at"]),
        ]
        db_table = "message"

    def __str__(self):
        return f"{self.role.capitalize()} - {self.text[:30]}"


class UserMemory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="memories"
    )
    key = models.CharField(max_length=100)
    value = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_memory"
        unique_together = ("user", "key")

    def __str__(self):
        return f"{self.key}: {self.value}"
