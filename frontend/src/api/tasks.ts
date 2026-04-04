import { api } from "./client";
import type { Task, TaskListResponse, TaskStatus } from "../types/task";

export type TaskFilters = {
  page: number;
  limit: number;
  status: "ALL" | TaskStatus;
  search: string;
};

export type TaskPayload = {
  title: string;
  description?: string;
  status?: TaskStatus;
};

export async function getTasks(filters: TaskFilters) {
  const response = await api.get<TaskListResponse>("/tasks", {
    params: {
      page: filters.page,
      limit: filters.limit,
      status: filters.status === "ALL" ? undefined : filters.status,
      search: filters.search || undefined,
    },
  });

  return response.data;
}

export async function createTaskRequest(payload: TaskPayload) {
  const response = await api.post<{ message: string; task: Task }>("/tasks", payload);
  return response.data;
}

export async function updateTaskRequest(taskId: string, payload: Partial<TaskPayload>) {
  const response = await api.patch<{ message: string; task: Task }>(`/tasks/${taskId}`, payload);
  return response.data;
}

export async function deleteTaskRequest(taskId: string) {
  const response = await api.delete<{ message: string }>(`/tasks/${taskId}`);
  return response.data;
}

export async function toggleTaskRequest(taskId: string) {
  const response = await api.patch<{ message: string; task: Task }>(`/tasks/${taskId}/toggle`);
  return response.data;
}
