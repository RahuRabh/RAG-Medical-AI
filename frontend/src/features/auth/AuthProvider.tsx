import { createContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { loginRequest, logoutRequest, refreshRequest, registerRequest } from "../../api/auth";
import {
  clearStoredAccessToken,
  clearStoredUser,
  getStoredAccessToken,
  getStoredUser,
  setStoredAccessToken,
  setStoredUser,
} from "../../lib/storage";
import type { User } from "../../types/auth";

type AuthContextValue = {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() => getStoredAccessToken());
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      const storedAccessToken = getStoredAccessToken();
      const storedUser = getStoredUser();

      if (storedAccessToken && storedUser) {
        setAccessToken(storedAccessToken);
        setUser(storedUser);
        setIsBootstrapping(false);
        return;
      }

      try {
        const response = await refreshRequest();
        setAccessToken(response.accessToken);
        setUser(response.user);
        setStoredAccessToken(response.accessToken);
        setStoredUser(response.user);
      } catch {
        clearStoredAccessToken();
        clearStoredUser();
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsBootstrapping(false);
      }
    }

    void bootstrap();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      user,
      isAuthenticated: Boolean(accessToken && user),
      isBootstrapping,
      async login(email, password) {
        const response = await loginRequest({ email, password });
        setAccessToken(response.accessToken);
        setUser(response.user);
        setStoredAccessToken(response.accessToken);
        setStoredUser(response.user);
      },
      async register(email, password) {
        const response = await registerRequest({ email, password });
        setAccessToken(response.accessToken);
        setUser(response.user);
        setStoredAccessToken(response.accessToken);
        setStoredUser(response.user);
      },
      async logout() {
        await logoutRequest();
        clearStoredAccessToken();
        clearStoredUser();
        setAccessToken(null);
        setUser(null);
      },
    }),
    [accessToken, isBootstrapping, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
