import { Router } from "express";
import {
  createChatTurn,
  deleteSessionById,
  getChatSessionById,
  getChatSessions,
  updateSessionById,
} from "../controllers/chat.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

export const chatRouter = Router();

chatRouter.use(authMiddleware);

chatRouter.get("/sessions", getChatSessions);
chatRouter.get("/sessions/:id", getChatSessionById);
chatRouter.delete("/delete-conversation/:conversationId", deleteSessionById);
chatRouter.put("/update-conversation/:conversationId", updateSessionById);
chatRouter.post("/", createChatTurn);
