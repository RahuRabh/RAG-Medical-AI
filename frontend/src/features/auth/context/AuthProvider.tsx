import { toast } from "sonner";
import type { ReactNode } from "react";
import { createContext, useEffect, useMemo, useState } from "react";

import type { AuthResponse, user as User } from "@/types/auth";

import {
  googleAuth,
  loginRequest,
  logoutRequest,
  refreshRequest,
  registerRequest,
  UpdatePasswordPayload,
  updatePasswordRequest,
} from "@/api/auth";

import {
  clearStoredUser,
  getStoredUser,
  setStoredUser,
  getStoredToken,
  setStoredToken,
  clearStoredToken,
} from "@/lib/storage";

import { UpdateProfilePayload, updateProfileRequest } from "@/api/profile";

type AuthContextValue = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  loginWithGoogle: (tokenId: string) => Promise<AuthResponse>;
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<AuthResponse>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<AuthResponse>;
  updatePassword: (payload: UpdatePasswordPayload) => Promise<void>;
  logout: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();

      // If they have a token and user cached locally, log them instantly
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        setIsBootstrapping(false);
        return;
      }

      // if nothing found locally, see if the backend cookie/session can refresh them
      try {
        const response = await refreshRequest();
        setToken(response.token);
        setUser(response.user);
        setStoredToken(response.token);
        setStoredUser(response.user);
      } catch {
        clearStoredToken();
        clearStoredUser();
        setToken(null);
        setUser(null);
      } finally {
        setIsBootstrapping(false);
      }
    }

    void bootstrap();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      isBootstrapping,
      isAuthModalOpen,
      async login(email, password) {
        try {
          const response = await loginRequest({ email, password });

          setToken(response.token);
          setUser(response.user);
          setStoredToken(response.token);
          setStoredUser(response.user);
          toast.success(response?.message || "Logged in successfully.");

          return response;
        } catch (error: any) {
          if (import.meta.env.VITE_ENV === "development") {
            console.error("Login failed", error);
          }
          toast.error(
            error?.response?.data?.error ||
              "Something went wrong here. please try again!",
          );
          throw error;
        }
      },

      async loginWithGoogle(tokenId) {
        try {
          const response = await googleAuth(tokenId);

          setToken(response.token);
          setUser(response.user);
          setStoredToken(response.token);
          setStoredUser(response.user);
          toast.success(response?.message || "Logged in successfully.");

          return response;
        } catch (error: any) {
          if (import.meta.env.VITE_ENV === "development") {
            console.error("Google login failed", error);
          }
          toast.error(
            error?.response?.data?.error ||
              "Something went wrong here. please try again!",
          );
          throw error;
        }
      },

      async register(name, email, password) {
        try {
          const response = await registerRequest({ name, email, password });

          setToken(response.token);
          setUser(response.user);
          setStoredToken(response.token);
          setStoredUser(response.user);
          toast.success(response?.message || "Registed successfully.");
          return response;
        } catch (error: any) {
          if (import.meta.env.VITE_ENV === "development") {
            console.error("Registration failed", error);
          }
          toast.error(
            error?.response?.data?.error ||
              "Something went wrong here. please try again!",
          );
          throw error;
        }
      },

      async updateProfile(payload: UpdateProfilePayload) {
        try {
          const response = await updateProfileRequest(payload);

          setUser(response.user);
          setStoredUser(response.user);
          toast.success(response?.message || "Profile updated successfully.");
          return response;
        } catch (error: any) {
          if (import.meta.env.VITE_ENV === "development") {
            console.error("Profile update failed", error);
          }
          toast.error(
            error?.response?.data?.error ||
              "Something went wrong here. please try again!",
          );
          throw error;
        }
      },

      async updatePassword(payload: UpdatePasswordPayload) {
        try {
          const response = await updatePasswordRequest(payload);

          setToken(response.token);
          setStoredUser(response.token);

          toast.success(response?.message || "Password updated successfully.");
          return response;
        } catch (error: any) {
          if (import.meta.env.VITE_ENV === "development") {
            console.error("Password update failed", error);
          }
          toast.error(
            error?.response?.data?.error ||
              "Something went wrong here. please try again!",
          );
          throw error;
        }
      },

      async logout() {
        try {
          await logoutRequest();
        } catch (error) {
          console.error("Backend logout failed", error);
        } finally {
          clearStoredToken();
          clearStoredUser();
          setToken(null);
          setUser(null);
        }
      },

      openAuthModal: () => setIsAuthModalOpen(true),
      closeAuthModal: () => setIsAuthModalOpen(false),
    }),
    [token, isBootstrapping, user, isAuthModalOpen],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
