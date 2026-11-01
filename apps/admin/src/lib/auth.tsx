import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getTokens, setTokens } from "./api";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Ctx {
  user: AdminUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getTokens()) return setReady(true);
    api<any>("/users/me")
      .then((me) => {
        if (me.role === "admin") setUser({ id: String(me._id ?? me.id), name: me.name, email: me.email, role: me.role });
        else setTokens(null);
      })
      .catch(() => setTokens(null))
      .finally(() => setReady(true));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api<{ user: AdminUser; accessToken: string; refreshToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (res.user.role !== "admin") throw new Error("This account doesn't have admin access.");
    setTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
    setUser(res.user);
  };

  const logout = () => {
    setTokens(null);
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, ready, login, logout }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const c = useContext(AuthCtx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}
