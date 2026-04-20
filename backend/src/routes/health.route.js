import { Router } from "express";

import { json } from "zod";
import { model } from "mongoose";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.status(200).json({
    message: "Backend is running",
  });
});

healthRouter.get("/full", async (_req, res) => {
  const mongoConnected = Boolean(process.env.MONGO_URI);
  const groqConfigured = Boolean(process.env.GROQ_API_KEY);

  res.json({
    status: "ok",
    mongoConnected,
    groqConfigured,
    llmProvided: process.env.LLM_PROVIDER,
    model: process.env.GROQ_MODEL,
  });
});
