import axios from "axios";

import type { ChatResponse, ChatSessionSummary, StoredMessage, StructuredContext } from "../types/chat";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

const publicApi = axios.create({
  baseURL: apiBaseUrl,
});

type SendChatPayload = {
  conversationId: string | null;
  message: string;
  structuredContext: StructuredContext;
};

export async function sendChatMessage(payload: SendChatPayload) {
  const response = await publicApi.post<ChatResponse>("/api/chat", payload);
  return response.data;
}

export async function getChatSessions() {
  const response = await publicApi.get<{ sessions: ChatSessionSummary[] }>("/api/chat/sessions");
  return response.data.sessions;
}

export async function getChatSession(sessionId: string) {
  const response = await publicApi.get<{
    conversation: {
      id: string;
      patientName?: string;
      activeDisease?: string;
      activeIntent?: string;
      activeLocation?: string;
    };
    messages: StoredMessage[];
  }>(`/api/chat/sessions/${sessionId}`);

  return response.data;
}
