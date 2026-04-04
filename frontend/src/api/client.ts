import axios from "axios";

import {
  clearStoredAccessToken,
  clearStoredUser,
  getStoredAccessToken,
  setStoredAccessToken,
  setStoredUser,
} from "../lib/storage";
import type { AuthResponse } from "../types/auth";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

api.interceptors.request.use((config) => {
  const token = getStoredAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

async function refreshAccessToken() {
  const response = await axios.post<AuthResponse>(`${apiBaseUrl}/auth/refresh`, undefined, {
    withCredentials: true,
  });

  setStoredAccessToken(response.data.accessToken);
  setStoredUser(response.data.user);

  return response.data.accessToken;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as { _retry?: boolean; headers?: Record<string, string> };

    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken()
        .catch((refreshError) => {
          clearStoredAccessToken();
          clearStoredUser();
          return Promise.reject(refreshError);
        })
        .finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
    }

    const newToken = await refreshPromise;
    originalRequest._retry = true;
    originalRequest.headers = originalRequest.headers ?? {};
    originalRequest.headers.Authorization = `Bearer ${newToken}`;

    return api(originalRequest);
  },
);
