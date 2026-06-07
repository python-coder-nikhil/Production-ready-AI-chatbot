const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const LOGIN_API = `${BASE_URL}/login`;
const GET_CONVERSATION_API = `${BASE_URL}/get-conversations`;
const GET_USER_MESSAGES_API = `${BASE_URL}/get-user-messages`;
const GET_AI_RESPONSE_API = `${BASE_URL}/ai-response`;
const CREATE_CONVERSATION_OR_MESSAGE_API = `${BASE_URL}/create-conversation-or-message`;
const DELETE_CONVERSATION_API = `${BASE_URL}/delete-conversation`;
const SEARCH_API = `${BASE_URL}/search`;
const RENAME_CONVERSATION_API = `${BASE_URL}/rename-conversation`;
export {
  LOGIN_API,
  GET_CONVERSATION_API,
  GET_USER_MESSAGES_API,
  GET_AI_RESPONSE_API,
  CREATE_CONVERSATION_OR_MESSAGE_API,
  DELETE_CONVERSATION_API,
  SEARCH_API,
  RENAME_CONVERSATION_API,
};
