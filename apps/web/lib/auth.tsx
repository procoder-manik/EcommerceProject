"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, getTokens, setTokens, type Tokens } from "./api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
}

interface AuthState {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

type AuthResponse = { user: User } & Tokens;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!getTokens()) {
        setReady(true);
        return;
      }
      try {
        const me = await api<any>("/users/me");
        if (alive) setUser({ id: String(me._id ?? me.id), name: me.name, email: me.email, role: me.role });
      } catch {
        setTokens(null);
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const finish = useCallback((res: AuthResponse) => {
    setTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
    setUser(res.user);
    return res.user;
  }, []);

  const login = useCallback(
    async (email: string, password: string) =>
      finish(await api<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) })),
    [finish]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) =>
      finish(await api<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) })),
    [finish]
  );

  const logout = useCallback(async () => {
    const tokens = getTokens();
    const current = user;
    setTokens(null);
    setUser(null);
    if (tokens && current) {
      await api("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ userId: current.id, refreshToken: tokens.refreshToken }),
      }).catch(() => undefined);
    }
  }, [user]);

  const value = useMemo(() => ({ user, ready, login, register, logout }), [user, ready, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
