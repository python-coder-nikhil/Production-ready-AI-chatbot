from django.urls import path
from .api.frontend_apis import (
    check_db_connection,
    login_api,
    get_user_conversations,
    get_messages,
    ai_response,
    create_conversation_or_message,
    delete_conversation,
    searching_api,
    rename_conversation,
)
from .views import check_server
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


urlpatterns = [
    path("", check_server, name="check_server"),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/check-db-connection", check_db_connection, name="check_db_connection"),
    path("api/login", login_api, name="login"),
    path(
        "api/get-conversations", get_user_conversations, name="get_user_conversations"
    ),
    path("api/get-user-messages", get_messages, name="get_user_messages"),
    path("api/ai-response", ai_response, name="ai_response"),
    path(
        "api/create-conversation-or-message",
        create_conversation_or_message,
        name="create_conversation_or_message",
    ),
    path("api/delete-conversation", delete_conversation, name="delete_conversation"),
    path("api/search", searching_api, name="search"),
    path("api/rename-conversation", rename_conversation, name="rename_conversation"),
]
