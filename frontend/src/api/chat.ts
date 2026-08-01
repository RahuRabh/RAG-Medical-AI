import { api } from "./client";

import type {
  ChatResponse,
  ChatSessionSummary,
  StoredMessage,
  StructuredContext,
} from "../types/chat";

type SendChatPayload = {
  conversationId: string | null;
  message: string;
  structuredContext: StructuredContext;
};

export async function sendChatMessage(payload: SendChatPayload) {
  const response = await api.post<ChatResponse>("/chat", payload);
  return response.data;
}

export async function getChatSessions() {
  const response = await api.get<{ sessions: ChatSessionSummary[] }>(
    "/chat/sessions",
  );
  return response.data.sessions;
}

export async function getChatSession(sessionId: string) {
  const response = await api.get<{
    conversation: {
      id: string;
      patientName?: string;
      activeDisease?: string;
      activeIntent?: string;
      activeLocation?: string;
    };
    messages: StoredMessage[];
  }>(`/chat/sessions/${sessionId}`);

  return response.data;
}

export async function deleteConversationById(conversationId: string | null) {
  const response = await api.delete(
    `/chat/delete-conversation/${conversationId}`,
  );

  return response.data;
}

export async function UpdateConversationById(
  conversationId: string | null,
  newTitle: string | null,
) {
  const response = await api.put(`/chat/update-conversation/${conversationId}`, {
    newTitle: newTitle?.trim(),
  });

  return response.data;
}
