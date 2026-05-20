"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import type { CustomerProfileData } from "@/types/api";

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string } };

export function ProfileClient() {
  const [profile, setProfile] = useState<CustomerProfileData | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const data = await getJson<CustomerProfileData>("/api/account/profile");
      if (cancelled) {
        return;
      }

      if (data.ok) {
        setProfile(data.data);
        setFullName(data.data.fullName ?? "");
        setPhone(data.data.phone ?? "");
      }

      setLoading(false);
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const data = await getJson<CustomerProfileData>("/api/account/profile", {
      method: "PATCH",
      body: JSON.stringify({ fullName, phone }),
    });

    setSaving(false);

    if (!data.ok) {
      setMessage(data.error.message);
      return;
    }

    setProfile(data.data);
    setMessage("Profile updated.");
  }

  if (loading) {
    return <ProfileShell subtitle="Loading profile..." />;
  }

  if (!profile) {
    return (
      <ProfileShell subtitle="Please sign in to edit your profile.">
        <Link
          href="/account"
          className="inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-black text-white"
        >
          Login / Register
        </Link>
      </ProfileShell>
    );
  }

  return (
    <ProfileShell subtitle={profile.email}>
      <form
        onSubmit={saveProfile}
        className="grid max-w-xl gap-3 rounded-lg border border-border bg-surface p-5"
      >
        <label className="grid gap-2 text-sm font-black text-foreground">
          Full name
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            minLength={2}
            maxLength={120}
            className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-bold outline-none focus:border-brand"
          />
        </label>
        <label className="grid gap-2 text-sm font-black text-foreground">
          Phone
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            inputMode="numeric"
            maxLength={10}
            placeholder="10-digit mobile number"
            className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-bold outline-none focus:border-brand"
          />
        </label>
        <p className="text-xs font-bold text-muted">
          Email changes will be added with the verified email flow.
        </p>
        <button
          disabled={saving}
          className="h-11 rounded-lg bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-surface-strong disabled:text-muted"
        >
          {saving ? "Saving..." : "Save profile"}
        </button>
        {message ? (
          <p className="text-sm font-bold text-muted">{message}</p>
        ) : null}
      </form>
    </ProfileShell>
  );
}

function ProfileShell({
  subtitle,
  children,
}: {
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/account" className="text-sm font-black text-brand">
        Back to account
      </Link>
      <p className="mt-5 text-sm font-black uppercase text-brand">Account</p>
      <h1 className="mt-2 font-display text-4xl font-black text-foreground">
        Profile
      </h1>
      <p className="mt-2 text-sm font-bold text-muted">{subtitle}</p>
      <div className="mt-8">{children}</div>
    </main>
  );
}

async function getJson<T>(
  url: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: init?.body ? { "content-type": "application/json" } : undefined,
    ...init,
  });
  return (await response.json().catch(() => ({
    ok: false,
    error: { message: "Something went wrong." },
  }))) as ApiResponse<T>;
}
