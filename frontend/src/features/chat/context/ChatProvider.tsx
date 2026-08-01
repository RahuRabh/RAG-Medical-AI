import { toast } from "sonner";
import { useAuth } from "../../auth/context/useAuth";
import { createContext, useState, useEffect, ReactNode } from "react";

import { makeId, mapStoredMessagesToChatMessages } from "./chatHelpers";

import {
  deleteConversationById,
  getChatSession,
  getChatSessions,
  sendChatMessage,
  UpdateConversationById,
} from "@/api/chat";

import type {
  ChatMessage,
  ChatSessionSummary,
  StructuredContext,
} from "@/types/chat";

export type ChatContextType = {
  conversationId: string | null;
  structuredContext: StructuredContext;
  messages: ChatMessage[];
  sessions: ChatSessionSummary[];
  isLoading: boolean;
  isHistoryLoading: boolean;
  error: string;
  setError: (err: string) => void;
  updateContext: (field: keyof StructuredContext, value: string) => void;
  resetChatState: () => void;
  refreshSessions: () => Promise<void>;
  openSession: (sessionId: string) => Promise<void>;
  sendMessage: (textContent: string) => Promise<void>;
  deleteConversation: (messageId: string | null) => Promise<void>;
  updateConversation: (
    conversationId: string | null,
    newTitle: string | null,
  ) => Promise<void>;
};

export const ChatContext = createContext<ChatContextType | null>(null);

const emptyContext: StructuredContext = {
  patientName: "",
  disease: "",
  intent: "",
  location: "",
};

export function ChatProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [structuredContext, setStructuredContext] =
    useState<StructuredContext>(emptyContext);

  const refreshSessions = async () => {
    if (!auth.isAuthenticated) {
      setSessions([]);
      return;
    }
    try {
      const nextSessions = await getChatSessions();
      setSessions(nextSessions);
    } catch (sessionError) {
      console.error("Failed to sync chat sessions:", sessionError);
      setError("Failed to reload chat list summaries.");
    }
  };

  useEffect(() => {
    if (!auth.isAuthenticated) {
      setSessions([]);
      setConversationId(null);
      setMessages([]);
      setStructuredContext(emptyContext);
      setError("");
      return;
    }
    void refreshSessions();
  }, [auth.isAuthenticated]);

  const updateContext = (field: keyof StructuredContext, value: string) => {
    setStructuredContext((current) => ({ ...current, [field]: value }));
  };

  const resetChatState = () => {
    setConversationId(null);
    setMessages([]);
    setStructuredContext(emptyContext);
    setError("");
  };

  const openSession = async (sessionId: string) => {
    setIsHistoryLoading(true);
    setError("");
    try {
      const session = await getChatSession(sessionId);
      setConversationId(session.conversation.id);
      setStructuredContext({
        patientName: session.conversation.patientName ?? "",
        disease: session.conversation.activeDisease ?? "",
        intent: session.conversation.activeIntent ?? "",
        location: session.conversation.activeLocation ?? "",
      });
      setMessages(mapStoredMessagesToChatMessages(session.messages));
    } catch (sessionError) {
      console.error(sessionError);
      toast.error("Failed to load historical session details");
      setError("Could not retrieve session details.");
      throw sessionError;
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const sendMessage = async (textContent: string) => {
    const targetQuery = textContent.trim() || structuredContext.intent.trim();
    if (!targetQuery) {
      setError("Ask a question or add an intent before submitting.");
      throw new Error("Empty query validation failure");
    }

    setIsLoading(true);
    setError("");
    setMessages((current) => [
      ...current,
      { id: makeId(), role: "user", content: targetQuery },
    ]);

    try {
      const result = await sendChatMessage({
        conversationId,
        message: targetQuery,
        structuredContext,
      });

      setConversationId(result.conversationId);
      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          answer: result.answer,
          sources: result.sources,
          metadata: result.metadata,
        },
      ]);
      await refreshSessions();
    } catch (requestError) {
      console.error(requestError);
      toast.error(
        "The assistant could not respond. Please verify your connection setup.",
      );
      setError(
        "The assistant could not respond. Please verify your connection setup.",
      );
      throw requestError;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (messageId: typeof conversationId) => {
    if (!messageId) return;
    setError("");
    try {
      await deleteConversationById(messageId);
      setMessages((current) => current.filter((msg) => msg.id !== messageId));
      if (messageId === conversationId) resetChatState();
      await refreshSessions();
      toast.success("Conversation Deleted");
    } catch (requestError) {
      console.error("Failed to delete conversation", requestError);
      toast.error("Could not delete the conversation. Please try again.");
      setError("Could not delete the conversation. Please try again.");
    }
  };

  const updateConversation = async (
    conversationId: string | null,
    newTitle: string | null,
  ) => {
    if (!conversationId || !newTitle) return;
    setError("");
    try {
      await UpdateConversationById(conversationId, newTitle);
      await refreshSessions();
      toast.success("Conversation renamed");
    } catch (requestError) {
      console.error("Failed to rename conversation", requestError);
      toast.error("Could not rename the conversation. Please try again.");
      setError("Could not rename the conversation. Please try again.");
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversationId,
        structuredContext,
        messages,
        sessions,
        isLoading,
        isHistoryLoading,
        error,
        setError,
        updateContext,
        resetChatState,
        refreshSessions,
        openSession,
        sendMessage,
        deleteConversation,
        updateConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
