import { Router } from "express";

import { createChatTurn, getChatSessionById, getChatSessions } from "../controllers/chat.controller.js";

export const chatRouter = Router();

chatRouter.get("/sessions", getChatSessions);
chatRouter.get("/sessions/:id", getChatSessionById);
chatRouter.post("/", createChatTurn);
