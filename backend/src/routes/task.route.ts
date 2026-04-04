import { Router } from "express";
import { z } from "zod";

import {
  createTaskController,
  deleteTaskController,
  getTaskController,
  listTasksController,
  toggleTaskController,
  updateTaskController,
} from "../controllers/task.controller.js";
import { TaskStatus } from "../generated/prisma/enums.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validateBody, validateParams } from "../middlewares/validate.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

const taskStatusSchema = z.preprocess((value) => {
  if (typeof value === "string") {
    return value.toUpperCase();
  }

  return value;
}, z.nativeEnum(TaskStatus));

const taskIdParamsSchema = z.object({
  id: z.string().min(1, "Task id is required"),
});

const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Title is too long"),
  description: z
    .string()
    .trim()
    .max(1000, "Description is too long")
    .optional()
    .transform((value) => value || undefined),
  status: taskStatusSchema.optional(),
});

const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1, "Title cannot be empty").max(120, "Title is too long").optional(),
    description: z
      .union([z.string().trim().max(1000, "Description is too long"), z.null()])
      .optional()
      .transform((value) => {
        if (value === "") {
          return null;
        }

        return value;
      }),
    status: taskStatusSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const taskRouter = Router();

taskRouter.use(authMiddleware);

taskRouter.get("/", asyncHandler(listTasksController));
taskRouter.post("/", validateBody(createTaskSchema), asyncHandler(createTaskController));
taskRouter.get("/:id", validateParams(taskIdParamsSchema), asyncHandler(getTaskController));
taskRouter.patch(
  "/:id",
  validateParams(taskIdParamsSchema),
  validateBody(updateTaskSchema),
  asyncHandler(updateTaskController),
);
taskRouter.delete("/:id", validateParams(taskIdParamsSchema), asyncHandler(deleteTaskController));
taskRouter.patch(
  "/:id/toggle",
  validateParams(taskIdParamsSchema),
  asyncHandler(toggleTaskController),
);
