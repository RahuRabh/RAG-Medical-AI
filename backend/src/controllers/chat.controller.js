import { z } from "zod";

import { getChatSession, handleMockChat, listChatSessions } from "../services/chat/chat.service.js";
import { asyncHandler } from "../utils/async-handler.js";

const chatBodySchema = z.object({
  conversationId: z.string().nullable().optional(),
  message: z.string().trim().min(1, "Message is required"),
  structuredContext: z
    .object({
      patientName: z.string().optional(),
      disease: z.string().optional(),
      intent: z.string().optional(),
      location: z.string().optional(),
    })
    .optional(),
});

export const createChatTurn = asyncHandler(async (req, res) => {
  const body = chatBodySchema.parse(req.body);
  const result = await handleMockChat(body);

  res.status(201).json(result);
});

export const getChatSessions = asyncHandler(async (_req, res) => {
  const sessions = await listChatSessions();
  res.status(200).json({ sessions });
});

export const getChatSessionById = asyncHandler(async (req, res) => {
  const sessionId = z.string().parse(req.params.id);
  const session = await getChatSession(sessionId);
  res.status(200).json(session);
});
