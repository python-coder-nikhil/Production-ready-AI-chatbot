import axios from "axios";
import CryptoJS from "crypto-js";
import Cookies from "js-cookie";

import {
  LOGIN_API,
  GET_CONVERSATION_API,
  GET_USER_MESSAGES_API,
  GET_AI_RESPONSE_API,
  CREATE_CONVERSATION_OR_MESSAGE_API,
  DELETE_CONVERSATION_API,
  SEARCH_API,
  RENAME_CONVERSATION_API,
} from "../utils/Constants";

const SECRET_KEY = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function getDecryptedToken() {
  const encrypted = Cookies.get("auth_token");
  if (!encrypted) throw new Error("Login expired. Please login again.");

  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
    const token = bytes.toString(CryptoJS.enc.Utf8);
    if (!token) {
      Cookies.remove("auth_token");
      return null;
    }
    return token;
  } catch {
    Cookies.remove("auth_token");
    return null;
  }
}

const api = axios.create({
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = getDecryptedToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const loginUser = async (
  method,
  email = null,
  password = null,
  token = null
) => {
  try {
    const payload =
      method === "google" ? { method, token } : { method, email, password };

    const res = await axios.post(LOGIN_API, payload);

    if (res.data?.status !== 1) {
      return { status: 0, error: res.data?.error || "Login failed" };
    }

    const userData = res.data.data || {};
    const userToken = userData.access_token;
    const safeUserData = { ...userData };
    delete safeUserData.access_token;
    delete safeUserData.uuid;
    delete safeUserData.refresh_token;

    localStorage.setItem("userdata", JSON.stringify(safeUserData));
    if (userToken) {
      const encryptedToken = CryptoJS.AES.encrypt(
        userToken,
        SECRET_KEY
      ).toString();

      Cookies.set("auth_token", encryptedToken, {
        expires: 7,
        secure: window.location.protocol === "https:",
        sameSite: "Lax",
      });
    }

    return res.data;
  } catch (err) {
    console.error("Login failed:", err.response?.data || err.message);
    throw new Error("Unable to login. Try again.");
  }
};

export const getConversations = async () => {
  try {
    const res = await api.get(GET_CONVERSATION_API);
    return res.data?.data || [];
  } catch (err) {
    console.error(
      "Conversations fetch failed:",
      err.response?.data || err.message
    );
    throw new Error("Failed to load conversations.");
  }
};

export const getUserMessages = async (chatId) => {
  try {
    const res = await api.get(
      `${GET_USER_MESSAGES_API}?conversation_id=${chatId}`
    );
    return res.data;
  } catch (err) {
    console.error("Messages fetch failed:", err.response?.data || err.message);
    throw new Error("Failed to load messages.");
  }
};

export const getAIResponseAPI = async (userInput, conversationId) => {
  try {
    const res = await api.post(GET_AI_RESPONSE_API, {
      user_input: userInput,
      conversation_id: conversationId,
    });
    return res.data;
  } catch (err) {
    console.error("AI response failed:", err.response?.data || err.message);
    throw new Error("AI response failed.");
  }
};

export const createConversationOrMessage = async (
  conversationId,
  messageText
) => {
  try {
    const payload = { text: messageText };
    if (!conversationId || conversationId.startsWith("chat_")) {
      payload.title =
        messageText.split(" ").slice(0, 4).join(" ") +
        (messageText.split(" ").length > 4 ? "..." : "");
    } else {
      payload.conversation_id = conversationId;
    }

    const res = await api.post(CREATE_CONVERSATION_OR_MESSAGE_API, payload);
    return res.data;
  } catch (err) {
    console.error("Create message failed:", err.response?.data || err.message);
    throw new Error("Failed to send message.");
  }
};

export const deleteConversation = async (conversationId) => {
  try {
    const res = await api.post(DELETE_CONVERSATION_API, {
      conversation_id: conversationId,
    });
    return res.data;
  } catch (err) {
    console.error("Delete failed:", err.response?.data || err.message);
    throw new Error("Failed to delete conversation.");
  }
};

export const searchApi = async (query) => {
  try {
    const res = await api.post(`${SEARCH_API}`, {
      query,
    });
    return res.data;
  } catch (err) {
    console.error("Search failed:", err.response?.data || err.message);
    throw new Error("Search failed.");
  }
};

export const updateConversationTitle = async (conversationId, title) => {
  try {
    const res = await api.post(`${RENAME_CONVERSATION_API}`, {
      conversation_id: conversationId,
      new_title: title,
    });

    return res.data;
  } catch (err) {
    console.error("Update failed:", err.response?.data || err.message);
    throw new Error("Failed to update conversation title.");
  }
};
