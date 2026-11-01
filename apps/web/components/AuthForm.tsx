"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { login, register } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") && params.get("next")!.startsWith("/") ? params.get("next")! : "/account";
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isLogin = mode === "login";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      if (isLogin) await login(String(f.get("email")), String(f.get("password")));
      else await register(String(f.get("name")), String(f.get("email")), String(f.get("password")));
      router.push(next);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-7" noValidate={false}>
      {!isLogin && (
        <div>
          <label htmlFor="name" className="label">Full name</label>
          <input id="name" name="name" required autoComplete="name" className="field" />
        </div>
      )}
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field" />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={isLogin ? 1 : 8}
          autoComplete={isLogin ? "current-password" : "new-password"}
          className="field"
        />
        {!isLogin && <p className="mt-2 text-xs text-ink-mute">At least 8 characters.</p>}
      </div>
      {error && (
        <p role="alert" className="border-l-2 border-clay bg-clay-wash/50 px-4 py-3 text-sm text-clay-deep">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn w-full">
        {busy ? "One moment…" : isLogin ? "Sign in" : "Create account"}
      </button>
      <p className="text-sm text-ink-soft">
        {isLogin ? "New here? " : "Already have an account? "}
        <Link href={`${isLogin ? "/register" : "/login"}${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`} className="link-u text-ink">
          {isLogin ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
