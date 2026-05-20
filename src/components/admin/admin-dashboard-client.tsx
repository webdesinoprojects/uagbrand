"use client";

import { useEffect, useState } from "react";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import type { AdminDashboardData } from "@/types/api";

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string } };

export function AdminDashboardClient() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | ApiResponse<AdminDashboardData>
        | null;

      if (cancelled) {
        return;
      }

      if (!response.ok || !payload) {
        setMessage("Dashboard data is unavailable.");
        return;
      }

      if (!payload.ok) {
        setMessage(payload.error.message);
        return;
      }

      setData(payload.data);
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  if (data) {
    return <AdminDashboard data={data} />;
  }

  return (
    <div className="grid min-h-[420px] place-items-center rounded-lg border border-border bg-surface p-8">
      <div className="text-center">
        <p className="text-xs font-black uppercase text-brand">Dashboard</p>
        <h1 className="mt-2 font-display text-3xl font-black text-foreground">
          {message ? "Could not load dashboard" : "Loading dashboard"}
        </h1>
        <p className="mt-2 text-sm font-bold text-muted">
          {message ?? "Checking your admin session and loading live metrics."}
        </p>
      </div>
    </div>
  );
}
