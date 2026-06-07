from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from ..serializers import *
from ..utils import *
from ..models import *
from django.db import connections
from django.db.utils import OperationalError
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from dotenv import load_dotenv
from ..utils import HFChatbot
import os
from pgvector.django import CosineDistance
from django.utils import timezone

load_dotenv()


@api_view(["GET"])
def check_db_connection(request):
    db_conn = connections["default"]
    try:
        db_conn.cursor()
    except OperationalError:
        connected = False
        return Response(
            {
                "status": int(os.getenv("ERROR", 0)),
                "connected": connected,
            },
            status=status.HTTP_200_OK,
        )
    else:
        connected = True
        return Response(
            {
                "status": int(os.getenv("SUCCESS", 1)),
                "connected": connected,
            },
            status=status.HTTP_200_OK,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def login_api(request):
    try:
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=False)
        if serializer.errors:
            first_error = next(iter(serializer.errors.values()))[0]
            return Response(
                {
                    "status": int(os.getenv("ERROR", 0)),
                    "error": first_error,
                },
                status=status.HTTP_200_OK,
            )

        data = serializer.save()

        return Response(data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {
                "status": int(os.getenv("ERROR", 0)),
                "error": "Internal server error",
                "detail": str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_conversations(request):
    try:
        user = request.user
        conversations = (
            Conversation.objects.filter(
                user=user, is_deleted=False, messages__isnull=False
            )
            .only("id", "title", "created_at")
            .order_by("-created_at")
            .distinct()
        )

        total = conversations.count()

        if total == 0:
            return Response(
                {
                    "status": int(os.getenv("SUCCESS", 1)),
                    "message": "No conversations found",
                    "total_conversations": 0,
                    "data": [],
                },
                status=status.HTTP_200_OK,
            )

        serializer = ConversationSerializer(conversations, many=True)

        return Response(
            {
                "status": int(os.getenv("SUCCESS", 1)),
                "user": user.username,
                "total_conversations": total,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        logger.exception("Error in get_user_conversations")
        return Response(
            {
                "status": int(os.getenv("ERROR", 0)),
                "message": "Unexpected error occurred.",
                "error": str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_messages(request):
    conversation_id = request.query_params.get("conversation_id")

    if not conversation_id:
        return Response(
            {
                "status": int(os.getenv("ERROR")),
                "message": "conversation_id parameter is required",
            },
            status=status.HTTP_200_OK,
        )

    try:
        conversation = (
            Conversation.objects.filter(
                id=conversation_id, user=request.user, is_deleted=False
            )
            .only("id")
            .first()
        )

        if not conversation:
            return Response(
                {
                    "status": int(os.getenv("ERROR")),
                    "message": "Conversation not found or access denied",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        messages = (
            Message.objects.filter(conversation_id=conversation_id)
            .only("id", "role", "text", "created_at")
            .order_by("created_at")
        )

        total = messages.count()

        if total == 0:
            return Response(
                {
                    "status": int(os.getenv("SUCCESS")),
                    "message": "No messages found for this conversation",
                    "conversation_id": conversation_id,
                    "data": [],
                },
                status=status.HTTP_200_OK,
            )

        serializer = MessageSerializer(messages, many=True)

        return Response(
            {
                "status": int(os.getenv("SUCCESS")),
                "conversation_id": conversation_id,
                "total_messages": total,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        return Response(
            {
                "status": int(os.getenv("ERROR")),
                "message": "Error fetching messages",
                "error": str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ai_response(request):
    try:
        user_input = request.data.get("user_input")
        conversation_id = request.data.get("conversation_id")

        if not user_input:
            return Response(
                {
                    "status": int(os.getenv("ERROR")),
                    "message": "User input is required",
                },
                status=status.HTTP_200_OK,
            )

        try:
            conversation = Conversation.objects.get(
                id=conversation_id, user=request.user, is_deleted=False
            )
        except Conversation.DoesNotExist:
            return Response(
                {
                    "status": int(os.getenv("ERROR")),
                    "message": "Conversation not found or access denied",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        hf_chatbot = HFChatbot()

        memory_entries = UserMemory.objects.filter(user=request.user).values_list(
            "key", "value"
        )
        if memory_entries:
            memory_context = "\n".join(
                f"{k.capitalize()}: {v}" for k, v in memory_entries
            )
        else:
            memory_context = "No user memory available."

        recent = (
            Message.objects.filter(conversation=conversation)
            .only("role", "text")
            .order_by("-created_at")[: hf_chatbot.MAX_HISTORY * 2]
        )

        recent_list = reversed(recent)
        chat_summary = "\n".join(
            f"{m.role.capitalize()}: {m.text}" for m in recent_list
        )

        messages = hf_chatbot.build_prompt(
            memory_context=memory_context,
            chat_summary=chat_summary,
            user_input=user_input,
        )

        ai_text = hf_chatbot.query_huggingface(messages)
        Message.objects.create(
            conversation=conversation,
            role="assistant",
            text=ai_text,
        )

        return Response(
            {
                "status": int(os.getenv("SUCCESS", 1)),
                "message": ai_text,
                "conversation_id": conversation.id,
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        print("❌ AI Response Error:", str(e))
        return Response(
            {
                "status": int(os.getenv("ERROR", 0)),
                "message": "Unexpected error while processing AI response",
                "error": str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_conversation_or_message(request):
    try:
        user = request.user
        conversation_id = request.data.get("conversation_id")
        message_text = request.data.get("text") or request.data.get("message")
        title = request.data.get("title", "New Conversation")

        if not conversation_id:
            serializer = CreateConversationSerializer(
                data={"title": title, "user": user.id}
            )

            serializer.is_valid(raise_exception=True)
            conversation = serializer.save()

            if message_text:
                message = save_message_with_embedding(conversation, user, message_text)
                memory_response = extract_memory_from_text(user, message_text)

                if memory_response:
                    return Response(
                        {
                            "status": int(os.getenv("SUCCESS", 1)),
                            "message": "User memory saved",
                            "data": {
                                "ai_response": memory_response,
                                "conversation_id": conversation.id,
                            },
                        },
                        status=status.HTTP_200_OK,
                    )

            return Response(
                {
                    "status": int(os.getenv("SUCCESS", 1)),
                    "message": "Conversation created successfully",
                    "data": {
                        "conversation_id": conversation.id,
                        "title": conversation.title,
                        "created_at": conversation.created_at,
                    },
                },
                status=status.HTTP_200_OK,
            )

        try:
            conversation = Conversation.objects.get(id=conversation_id, user=user)
        except Conversation.DoesNotExist:
            return Response(
                {
                    "status": int(os.getenv("ERROR", 0)),
                    "message": "Conversation not found or unauthorized",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if not message_text:
            return Response(
                {
                    "status": int(os.getenv("ERROR", 0)),
                    "message": "Message text is required",
                },
                status=status.HTTP_200_OK,
            )

        message = save_message_with_embedding(conversation, user, message_text)
        memory_response = extract_memory_from_text(user, message_text)

        if memory_response:
            return Response(
                {
                    "status": int(os.getenv("SUCCESS", 1)),
                    "message": "User memory saved",
                    "data": {"ai_response": memory_response},
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "status": int(os.getenv("SUCCESS", 1)),
                "message": "Message created successfully",
                "data": MessageSerializer(message).data,
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        print("❌ Combined API Error:", str(e))
        return Response(
            {
                "status": int(os.getenv("ERROR", 0)),
                "message": "Internal Server Error",
                "error": str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def delete_conversation(request):
    try:
        user = request.user
        conversation_id = request.data.get("conversation_id")

        if not conversation_id:
            return Response(
                {
                    "status": int(os.getenv("ERROR", 0)),
                    "message": "conversation_id parameter is required",
                },
                status=status.HTTP_200_OK,
            )

        try:
            conversation = Conversation.objects.get(
                id=conversation_id, user=user, is_deleted=False
            )
        except Conversation.DoesNotExist:
            return Response(
                {
                    "status": int(os.getenv("ERROR", 0)),
                    "message": "Conversation not found or unauthorized",
                },
                status=status.HTTP_200_OK,
            )

        Conversation.objects.filter(id=conversation.id).update(is_deleted=True)

        return Response(
            {
                "status": int(os.getenv("SUCCESS", 1)),
                "message": "Conversation deleted successfully",
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        print("❌ Delete Conversation Error:", str(e))
        return Response(
            {
                "status": int(os.getenv("ERROR", 0)),
                "message": "Internal Server Error",
                "error": str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def searching_api(request):
    user = request.user
    query = (request.data.get("query") or "").strip()

    try:
        base_messages = (
            Message.objects.filter(
                conversation__user=user,
                conversation__is_deleted=False,
            )
            .select_related("conversation")
            .only(
                "id",
                "text",
                "role",
                "created_at",
                "conversation__id",
                "conversation__title",
                "embedding",
            )
        )

        if not query:
            today = timezone.now().date()
            yesterday = today - timezone.timedelta(days=1)

            keyword_conversations = (
                Conversation.objects.filter(
                    user=user, is_deleted=False, created_at__date__in=[today, yesterday]
                )
                .only("id", "title", "created_at")
                .order_by("-created_at")[:20]
            )

            return Response(
                {
                    "keyword_conversations": ConversationSerializer(
                        keyword_conversations, many=True
                    ).data,
                    "keyword_messages": [],
                    "semantic_messages": [],
                },
                status=status.HTTP_200_OK,
            )

        keyword_conversations = (
            Conversation.objects.filter(
                user=user,
                is_deleted=False,
                title__icontains=query,
            )
            .only("id", "title", "created_at")
            .order_by("-created_at")[:20]
        )

        keyword_messages_qs = base_messages.filter(text__icontains=query).order_by(
            "-created_at"
        )

        keyword_messages = keyword_messages_qs[:50]
        semantic_messages = []
        if query:
            query_embedding = get_embedding(query)
            semantic_messages_qs = (
                base_messages.filter(role="user", embedding__isnull=False)
                .annotate(similarity=CosineDistance("embedding", query_embedding))
                .order_by("similarity")[:50]
            )

            semantic_messages = semantic_messages_qs

        return Response(
            {
                "keyword_conversations": ConversationSerializer(
                    keyword_conversations, many=True
                ).data,
                "keyword_messages": SearchMessageSerializer(
                    keyword_messages, many=True
                ).data,
                "semantic_messages": SearchMessageSerializer(
                    semantic_messages, many=True
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        print("❌ Search Error:", str(e))
        return Response(
            {
                "status": int(os.getenv("ERROR", 0)),
                "message": "Internal Server Error",
                "error": str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def rename_conversation(request):
    conversation_id = request.data.get("conversation_id")
    new_title = request.data.get("new_title")
    if not conversation_id or not new_title:
        return Response(
            {
                "status": int(os.getenv("ERROR", 0)),
                "message": "conversation_id and new_title are required",
            },
            status=status.HTTP_200_OK,
        )
    try:
        conv = Conversation.objects.filter(
            id=conversation_id, user=request.user, is_deleted=False
        )
        if conv.exists():
            conv.update(title=new_title)
            return Response(
                {"status": int(os.getenv("SUCCESS", 1)), "message": "updated"}
            )
        else:
            return Response(
                {"status": int(os.getenv("ERROR", 0)), "message": "not found"},
                status=status.HTTP_200_OK,
            )

    except Exception as e:
        print("❌ Rename Conversation Error:", str(e))
        return Response(
            {
                "status": int(os.getenv("ERROR", 0)),
                "message": "Internal Server Error",
                "error": str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
