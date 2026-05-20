"use client";

import { LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

import type { AdminSessionData } from "@/types/api";

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string } };

export function AdminLoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });
    const payload = (await response.json().catch(() => null)) as
      | ApiResponse<AdminSessionData>
      | null;

    setSubmitting(false);

    if (!response.ok || !payload) {
      setMessage("Please check your admin login.");
      return;
    }

    if (!payload.ok) {
      setMessage(payload.error.message);
      return;
    }

    if (!payload.data.authenticated) {
      setMessage("Please check your admin login.");
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <form
      onSubmit={login}
      className="grid w-full max-w-md gap-4 rounded-lg border border-border bg-surface p-6 shadow-[var(--shadow-soft)]"
    >
      <div>
        <p className="text-xs font-black uppercase text-brand">AllEarbuds Admin</p>
        <h1 className="mt-2 font-display text-3xl font-black text-foreground">
          Sign in
        </h1>
        <p className="mt-2 text-sm font-bold leading-6 text-muted">
          Use a staff account to manage catalog, CMS, orders and customers.
        </p>
      </div>

      <label className="grid gap-2 text-sm font-black text-foreground">
        Email
        <span className="flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-3 focus-within:border-brand">
          <Mail size={17} className="text-muted" />
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
          />
        </span>
      </label>

      <label className="grid gap-2 text-sm font-black text-foreground">
        Password
        <span className="flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-3 focus-within:border-brand">
          <LockKeyhole size={17} className="text-muted" />
          <input
            name="password"
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="current-password"
            className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none"
          />
        </span>
      </label>

      <button
        disabled={submitting}
        className="h-11 rounded-lg bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-surface-strong disabled:text-muted"
      >
        {submitting ? "Signing in..." : "Login"}
      </button>
      {message ? <p className="text-sm font-bold text-danger">{message}</p> : null}
    </form>
  );
}
