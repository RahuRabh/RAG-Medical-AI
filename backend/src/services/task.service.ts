import { TaskStatus } from "../generated/prisma/enums.js";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";

type TaskListInput = {
  userId: string;
  page: number;
  limit: number;
  status?: TaskStatus;
  search?: string;
};

type CreateTaskInput = {
  title: string;
  description?: string;
  status?: TaskStatus;
};

type UpdateTaskInput = {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
};

function buildTaskWhereClause({ userId, status, search }: Pick<TaskListInput, "userId" | "status" | "search">) {
  return {
    userId,
    ...(status ? { status } : {}),
    ...(search
      ? {
          title: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : {}),
  };
}

export async function listTasks(input: TaskListInput) {
  const { page, limit } = input;
  const skip = (page - 1) * limit;
  const where = buildTaskWhereClause(input);

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.task.count({ where }),
  ]);

  return {
    items: tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function createTask(userId: string, input: CreateTaskInput) {
  return prisma.task.create({
    data: {
      userId,
      title: input.title,
      description: input.description,
      status: input.status ?? TaskStatus.PENDING,
    },
  });
}

export async function getTaskById(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      userId,
    },
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  return task;
}

export async function updateTask(userId: string, taskId: string, input: UpdateTaskInput) {
  await getTaskById(userId, taskId);

  return prisma.task.update({
    where: { id: taskId },
    data: input,
  });
}

export async function deleteTask(userId: string, taskId: string) {
  await getTaskById(userId, taskId);

  await prisma.task.delete({
    where: { id: taskId },
  });
}

export async function toggleTaskStatus(userId: string, taskId: string) {
  const existingTask = await getTaskById(userId, taskId);

  const nextStatus =
    existingTask.status === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED;

  return prisma.task.update({
    where: { id: taskId },
    data: {
      status: nextStatus,
    },
  });
}
