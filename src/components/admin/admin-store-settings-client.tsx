"use client";

import { Check, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import type {
  AdminMediaAsset,
  AdminMediaListData,
  AdminSiteSettings,
} from "@/types/api";

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string } };

type FormState = {
  siteName: string;
  logoMediaId: string;
  contactEmail: string;
  contactPhone: string;
  addressLabel: string;
  footerDescription: string;
};

const emptyForm: FormState = {
  siteName: "ALLEARBUDS.COM",
  logoMediaId: "",
  contactEmail: "",
  contactPhone: "",
  addressLabel: "",
  footerDescription: "",
};

export function AdminStoreSettingsClient() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [mediaItems, setMediaItems] = useState<AdminMediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMessage(null);

    const [settingsResult, mediaResult] = await Promise.all([
      fetch("/api/admin/settings/store", { cache: "no-store" }).then((response) =>
        parseApi<AdminSiteSettings>(response),
      ),
      fetch("/api/admin/media?pageSize=100", { cache: "no-store" }).then(
        (response) => parseApi<AdminMediaListData>(response),
      ),
    ]);

    if (!settingsResult.ok) {
      setMessage(settingsResult.message);
      setLoading(false);
      return;
    }

    setForm({
      siteName: settingsResult.data.siteName,
      logoMediaId: settingsResult.data.logoMediaId ?? "",
      contactEmail: settingsResult.data.contactEmail ?? "",
      contactPhone: settingsResult.data.contactPhone ?? "",
      addressLabel: settingsResult.data.addressLabel ?? "",
      footerDescription: settingsResult.data.footerDescription ?? "",
    });

    if (mediaResult.ok) {
      setMediaItems(mediaResult.data.items);
    }

    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const response = await fetch("/api/admin/settings/store", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        siteName: form.siteName,
        logoMediaId: form.logoMediaId || null,
        contactEmail: form.contactEmail || null,
        contactPhone: form.contactPhone || null,
        addressLabel: form.addressLabel || null,
        footerDescription: form.footerDescription || null,
      }),
    });
    const payload = await parseApi<AdminSiteSettings>(response);

    if (!payload.ok) {
      setMessage(payload.message);
      setSaving(false);
      return;
    }

    setForm({
      siteName: payload.data.siteName,
      logoMediaId: payload.data.logoMediaId ?? "",
      contactEmail: payload.data.contactEmail ?? "",
      contactPhone: payload.data.contactPhone ?? "",
      addressLabel: payload.data.addressLabel ?? "",
      footerDescription: payload.data.footerDescription ?? "",
    });
    setMessage("Store settings saved.");
    setSaving(false);
  }

  const selectedLogo = mediaItems.find((item) => item.id === form.logoMediaId);

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-brand">Settings</p>
          <h1 className="mt-2 font-display text-3xl font-black text-foreground">
            Storefront Header & Footer
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-bold text-muted">
            Change the public site name, logo and footer contact text without
            touching code.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-black transition hover:border-brand"
        >
          <RefreshCw size={16} />
          Reload
        </button>
      </section>

      <section className="grid gap-5 rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-soft)] lg:grid-cols-[1fr_320px]">
        <form onSubmit={submit} className="grid gap-4">
          <TextField
            label="Site name"
            value={form.siteName}
            onChange={(siteName) => setForm((current) => ({ ...current, siteName }))}
            required
          />

          <label className="grid gap-2 text-xs font-black uppercase text-muted">
            Logo media
            <select
              value={form.logoMediaId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  logoMediaId: event.target.value,
                }))
              }
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-bold normal-case text-foreground outline-none transition focus:border-brand"
            >
              <option value="">Use default text logo</option>
              {mediaItems
                .filter((item) => item.resourceType === "image" || item.resourceType === "gif")
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.altText || item.url.split("/").pop() || item.id}
                  </option>
                ))}
            </select>
          </label>

          <TextField
            label="Contact email"
            value={form.contactEmail}
            onChange={(contactEmail) =>
              setForm((current) => ({ ...current, contactEmail }))
            }
          />
          <TextField
            label="Contact phone"
            value={form.contactPhone}
            onChange={(contactPhone) =>
              setForm((current) => ({ ...current, contactPhone }))
            }
          />
          <TextField
            label="Address label"
            value={form.addressLabel}
            onChange={(addressLabel) =>
              setForm((current) => ({ ...current, addressLabel }))
            }
          />
          <label className="grid gap-2 text-xs font-black uppercase text-muted">
            Footer description
            <textarea
              value={form.footerDescription}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  footerDescription: event.target.value,
                }))
              }
              rows={4}
              className="min-h-28 rounded-lg border border-border bg-background px-3 py-3 text-sm font-bold normal-case text-foreground outline-none transition focus:border-brand"
            />
          </label>

          {message ? (
            <p className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold text-muted">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving || loading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-black text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}
            Save settings
          </button>
        </form>

        <aside className="rounded-lg border border-border bg-background p-4">
          <p className="text-xs font-black uppercase text-brand">Public preview</p>
          <div className="mt-4 rounded-lg border border-border bg-slate-950 p-4 text-white">
            <div className="flex h-14 items-center justify-center">
              {selectedLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedLogo.thumbnailUrl ?? selectedLogo.url}
                  alt={selectedLogo.altText ?? form.siteName}
                  className="max-h-10 max-w-[180px] object-contain"
                />
              ) : (
                <span className="font-display text-lg font-black uppercase">
                  {form.siteName}
                </span>
              )}
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-border bg-surface p-4">
            <p className="text-sm font-black">{form.siteName}</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              {form.footerDescription || "Footer description"}
            </p>
            <div className="mt-3 grid gap-1 text-xs font-bold text-muted">
              <span>{form.contactEmail || "No email"}</span>
              <span>{form.contactPhone || "No phone"}</span>
              <span>{form.addressLabel || "No address label"}</span>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-xs font-black uppercase text-muted">
      {label}
      <input
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-bold normal-case text-foreground outline-none transition focus:border-brand"
      />
    </label>
  );
}

async function parseApi<T>(
  response: Response,
): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!payload) {
    return { ok: false, message: "The server did not return a usable response." };
  }

  if (!response.ok || !payload.ok) {
    return {
      ok: false,
      message: payload.ok
        ? "The request could not be completed."
        : payload.error.message,
    };
  }

  return { ok: true, data: payload.data };
}
