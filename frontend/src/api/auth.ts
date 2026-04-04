import { api } from "./client";
import type { AuthResponse } from "../types/auth";

export type AuthPayload = {
  email: string;
  password: string;
};

export async function registerRequest(payload: AuthPayload) {
  const response = await api.post<AuthResponse>("/auth/register", payload);
  return response.data;
}

export async function loginRequest(payload: AuthPayload) {
  const response = await api.post<AuthResponse>("/auth/login", payload);
  return response.data;
}

export async function refreshRequest() {
  const response = await api.post<AuthResponse>("/auth/refresh");
  return response.data;
}

export async function logoutRequest() {
  const response = await api.post<{ message: string }>("/auth/logout");
  return response.data;
}
