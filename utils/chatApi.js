// Chat APIs (/api/chat/*) - customer <-> admin / staff / broker / seller
// Messages / inbox / read are on Firestore directly (utils/firebaseChat.js)
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
import Cookies from "js-cookie";

const chatRequest = async (path, { method = "GET", body } = {}) => {
  const token = Cookies.get("accessToken") || Cookies.get("token");

  const response = await fetch(`${BASE_URL}chat/${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.status === false) {
    const error = new Error(data?.message || "Something went wrong.");
    error.status = response.status;
    throw error;
  }

  return data;
};

// bhumi-chat-firebase-token (signInWithCustomToken)
export const getChatFirebaseToken = () => chatRequest("firebase-token");

// bhumi-chat-contacts (admin side -> customers, customer -> admin / broker / seller by role)
export const getChatContacts = (search = "", perPage = 20, role = "") =>
  chatRequest(`contacts?per_page=${perPage}&search=${encodeURIComponent(search)}${role ? `&role=${role}` : ""}`);

// bhumi-chat-start ({ user_id?, role?, property_id? }) -> chat id + fields; first message creates chats/{id}
export const startChatConversation = (payload) => chatRequest("conversations", { method: "POST", body: payload });

// Deletes the chat from my list only
export const deleteChatConversation = (chatId) => chatRequest(`conversations/${encodeURIComponent(chatId)}`, { method: "DELETE" });
