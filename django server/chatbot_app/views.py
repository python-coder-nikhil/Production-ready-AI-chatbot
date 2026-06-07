from django.http import JsonResponse


def check_server(request):
    return JsonResponse({"message": "Server is running"})