export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
const KEY = "ecommere.admin.tokens";

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export const getTokens = (): Tokens | null => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Tokens) : null;
  } catch {
    return null;
  }
};

export const setTokens = (t: Tokens | null) => {
  try {
    if (t) localStorage.setItem(KEY, JSON.stringify(t));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function refresh(): Promise<boolean> {
  const t = getTokens();
  if (!t) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: t.refreshToken }),
    });
    if (!res.ok) throw new Error();
    setTokens((await res.json()).data);
    return true;
  } catch {
    setTokens(null);
    return false;
  }
}

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const t = getTokens();
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (init.body) headers["Content-Type"] = "application/json";
  if (t) headers.Authorization = `Bearer ${t.accessToken}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "Can't reach the API. Is it running on port 4000?");
  }
  if (res.status === 401 && retry && t && (await refresh())) return api<T>(path, init, false);
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, json?.error?.message ?? `Request failed (${res.status})`);
  return (json?.data ?? json) as T;
}

export const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-sky-50 text-sky-700",
  shipped: "bg-violet-50 text-violet-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-700",
};
