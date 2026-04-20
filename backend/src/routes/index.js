import { Router } from "express";

import { authRouter } from "./auth.route.js";
import { chatRouter } from "./chat.route.js";
import { healthRouter } from "./health.route.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/chat", chatRouter);
apiRouter.use("/health", healthRouter);
