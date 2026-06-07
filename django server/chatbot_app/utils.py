import requests
import os
from dotenv import load_dotenv
import re
from .models import *
from sentence_transformers import SentenceTransformer
from typing import List
import threading

load_dotenv()

HF_API_URL = os.getenv("HF_API_URL")
HF_HEADERS = {
    "Authorization": f"Bearer {os.getenv('HF_API_KEY')}",
    "Content-Type": "application/json",
}


def get_first_error(serializer_errors):
    first_error = None
    for field, messages in serializer_errors.items():
        if isinstance(messages, list) and messages:
            first_error = messages[0]
            break
        elif isinstance(messages, str):
            first_error = messages
            break
    return first_error


class HFChatbot:
    MODEL = os.getenv("HF_MODEL")
    MAX_HISTORY = 3

    def build_prompt(self, memory_context=None, chat_summary=None, user_input=None):
        system_prompt = f"""
            You are a friendly, concise, and knowledgeable AI assistant.

            Guidelines:
            - Respond directly and helpfully.
            - Do NOT say “It seems like we’re starting a new conversation.”
            - Do NOT explain how you work.
            - Use user memory naturally.
            - Stay concise and human-like.

            ### USER MEMORY
            {memory_context}

            ### RECENT CHAT HISTORY
            {chat_summary or "No previous chat messages."}
        """

        return [
            {"role": "system", "content": system_prompt.strip()},
            {"role": "user", "content": user_input},
        ]

    def query_huggingface(self, messages):
        if not self.MODEL:
            return "Error: HF model not configured on server."

        payload = {"model": self.MODEL, "messages": messages}

        try:
            response = requests.post(
                HF_API_URL,
                headers=HF_HEADERS,
                json=payload,
                timeout=40,
            )

            data = response.json()

            if "choices" in data:
                return data["choices"][0]["message"]["content"]

            if "error" in data:
                return (
                    f"Error from model: {data['error'].get('message', 'Unknown error')}"
                )

            return "Error: Unexpected response from HuggingFace API."

        except requests.exceptions.Timeout:
            return "Error: Hugging Face API timeout."

        except Exception as e:
            print(f"❌ HF API Error: {e}")
            return "Error: Unable to contact Hugging Face API."


def extract_memory_from_text(user, text):
    name_match = re.search(
        r"(?:my name is|call me)\s+([A-Za-z0-9_]+)", text, re.IGNORECASE
    )
    if name_match:
        name = name_match.group(1)
        UserMemory.objects.update_or_create(
            user=user,
            key="name",
            defaults={"value": name},
        )
        return f"Got it! I'll remember that your name is {name}."
    return None


_model_lock = threading.Lock()
_model_instance = None


def get_model():
    global _model_instance
    with _model_lock:
        if _model_instance is None:
            _model_instance = SentenceTransformer("all-MiniLM-L6-v2")
        return _model_instance


def get_embedding(text: str) -> List[float]:
    model = get_model()
    vector = model.encode(
        text,
        normalize_embeddings=True,
        convert_to_numpy=True,
    )
    return vector.tolist()


def save_message_with_embedding(conversation, user, message_text):
    existing_message = (
        Message.objects.filter(
            conversation=conversation,
            role="user",
            text=message_text,
            embedding__isnull=True,
        )
        .order_by("-created_at")
        .first()
    )

    if existing_message:
        message = existing_message
    else:
        message = Message.objects.create(
            conversation=conversation,
            role="user",
            text=message_text,
        )

    if not message.embedding:
        embedding = get_model().encode(message_text)
        message.embedding = embedding.tolist()
        message.save(update_fields=["embedding"])

    return message
