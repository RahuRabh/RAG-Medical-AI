import { Router } from "express";

import { authRouter } from "./auth.route.js";
import { healthRouter } from "./health.route.js";
import { taskRouter } from "./task.route.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/health", healthRouter);
apiRouter.use("/tasks", taskRouter);
