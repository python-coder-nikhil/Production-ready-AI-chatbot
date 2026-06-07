# from django.db.models.signals import post_save
# from django.dispatch import receiver
# from .models import Message
# from .utils import get_embedding


# @receiver(post_save, sender=Message)
# def generate_message_embedding(sender, instance, created, **kwargs):
#     if not created:
#         return

#     if instance.role != "user":
#         return

#     if instance.embedding:
#         return

#     try:
#         vector = get_embedding(instance.text)
#         Message.objects.filter(id=instance.id).update(embedding=vector)
#     except Exception as e:
#         print("❌ Embedding Error:", e)
