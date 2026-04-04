import type { Request, Response } from "express";
import { z } from "zod";

import { TaskStatus } from "../generated/prisma/enums.js";
import {
  createTask,
  deleteTask,
  getTaskById,
  listTasks,
  toggleTaskStatus,
  updateTask,
} from "../services/task.service.js";
import { AppError } from "../utils/app-error.js";

const taskStatusSchema = z.preprocess((value) => {
  if (typeof value === "string") {
    return value.toUpperCase();
  }

  return value;
}, z.nativeEnum(TaskStatus));

const taskListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  status: taskStatusSchema.optional(),
  search: z.string().trim().min(1).optional(),
});

function getAuthenticatedUserId(req: Request) {
  const userId = req.user?.sub;

  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  return userId;
}

function getTaskId(req: Request) {
  return String(req.params.id);
}

export async function listTasksController(req: Request, res: Response) {
  const query = taskListQuerySchema.parse(req.query);
  const result = await listTasks({
    userId: getAuthenticatedUserId(req),
    page: query.page,
    limit: query.limit,
    status: query.status,
    search: query.search,
  });

  return res.status(200).json(result);
}

export async function createTaskController(req: Request, res: Response) {
  const task = await createTask(getAuthenticatedUserId(req), req.body);

  return res.status(201).json({
    message: "Task created successfully",
    task,
  });
}

export async function getTaskController(req: Request, res: Response) {
  const task = await getTaskById(getAuthenticatedUserId(req), getTaskId(req));

  return res.status(200).json({ task });
}

export async function updateTaskController(req: Request, res: Response) {
  const task = await updateTask(getAuthenticatedUserId(req), getTaskId(req), req.body);

  return res.status(200).json({
    message: "Task updated successfully",
    task,
  });
}

export async function deleteTaskController(req: Request, res: Response) {
  await deleteTask(getAuthenticatedUserId(req), getTaskId(req));

  return res.status(200).json({
    message: "Task deleted successfully",
  });
}

export async function toggleTaskController(req: Request, res: Response) {
  const task = await toggleTaskStatus(getAuthenticatedUserId(req), getTaskId(req));

  return res.status(200).json({
    message: "Task status updated successfully",
    task,
  });
}
