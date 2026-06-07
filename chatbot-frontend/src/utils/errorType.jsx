import { AlertCircle, ServerCrash, Lock, SearchX, WifiOff } from "lucide-react";

export const ERROR_TYPES = {
  404: {
    code: "404",
    title: "Page Not Found",
    message:
      "The page you are looking for might have been removed or is temporarily unavailable.",
    icon: SearchX,
    color: "blue",
  },
  500: {
    code: "500",
    title: "Internal Server Error",
    message: "Something went wrong on our end. Please try again later.",
    icon: ServerCrash,
    color: "red",
  },
  403: {
    code: "403",
    title: "Access Forbidden",
    message: "You do not have permission to access this page.",
    icon: Lock,
    color: "yellow",
  },
  503: {
    code: "503",
    title: "Service Unavailable",
    message: "The service is temporarily unavailable. Try again soon.",
    icon: WifiOff,
    color: "purple",
  },
  401: {
    code: "401",
    title: "Unauthorized",
    message: "Please log in to access this content.",
    icon: AlertCircle,
    color: "orange",
  },
};
