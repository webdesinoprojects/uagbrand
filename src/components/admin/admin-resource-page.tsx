"use client";

import { upload, type UploadResponse } from "@imagekit/next";
import { Check, ImageIcon, Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import type {
  AdminMediaAsset,
  AdminMediaListData,
  AdminMediaUploadSignatureData,
  MediaResourceType,
  PaginationMeta,
} from "@/types/api";

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string } };

export type AdminResourceField = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "media";
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: { label: string; value: string }[];
  mediaResourceTypes?: Array<"image" | "video" | "gif" | "file">;
};

export type AdminResourceColumn = {
  label: string;
  value: string;
  kind?: "text" | "status" | "media" | "number";
};

export type AdminResourceConfig = {
  title: string;
  eyebrow: string;
  description: string;
  endpoint: string;
  singularLabel: string;
  searchPlaceholder?: string;
  fields: AdminResourceField[];
  columns: AdminResourceColumn[];
  defaultValues?: Record<string, string | number | null>;
};

type ResourceListData = {
  items: ResourceItem[];
  pagination?: PaginationMeta;
};

type ResourceItem = {
  id: string;
  [key: string]: unknown;
};

type MediaOption = Pick<
  AdminMediaAsset,
  "altText" | "id" | "resourceType" | "thumbnailUrl" | "url"
>;

export function AdminResourcePage({ config }: { config: AdminResourceConfig }) {
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaOption[]>([]);
  const [selected, setSelected] = useState<ResourceItem | null>(null);
  const [form, setForm] = useState<Record<string, string>>(toForm(config.defaultValues ?? {}));
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadFolder, setUploadFolder] = useState("cms");

  const mediaFields = useMemo(
    () => config.fields.filter((field) => field.type === "media"),
    [config.fields],
  );

  async function load() {
    setLoading(true);
    setMessage(null);

    const params = new URLSearchParams({ pageSize: "100" });
    if (query.trim()) params.set("q", query.trim());
    if (status) params.set("status", status);

    const response = await fetch(`${config.endpoint}?${params.toString()}`, {
      cache: "no-store",
    });
    const payload = await parseApi<ResourceListData>(response);

    if (!payload.ok) {
      setMessage(payload.message);
      setLoading(false);
      return;
    }

    setItems(payload.data.items);
    setLoading(false);
  }

  async function loadMedia() {
    if (mediaFields.length === 0) return;

    const response = await fetch("/api/admin/media?pageSize=100", {
      cache: "no-store",
    });
    const payload = await parseApi<AdminMediaListData>(response);

    if (payload.ok) {
      setMediaItems(payload.data.items);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
      void loadMedia();
    }, 0);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.endpoint]);

  function startCreate() {
    setSelected(null);
    setForm(toForm(config.defaultValues ?? {}));
    setMessage(null);
  }

  function startEdit(item: ResourceItem) {
    setSelected(item);
    setForm(toForm(item));
    setMessage(null);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const body = buildPayload(config.fields, form);
    const url = selected ? `${config.endpoint}/${selected.id}` : config.endpoint;
    const response = await fetch(url, {
      method: selected ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await parseApi<ResourceItem>(response);

    if (!payload.ok) {
      setMessage(payload.message);
      setSaving(false);
      return;
    }

    setSelected(payload.data);
    setForm(toForm(payload.data));
    setMessage(`${config.singularLabel} saved.`);
    setSaving(false);
    await load();
  }

  async function remove(item: ResourceItem) {
    const confirmed = window.confirm(
      `Delete "${getTitle(item)}"? Archive instead when this content is used by products or orders.`,
    );
    if (!confirmed) return;

    const response = await fetch(`${config.endpoint}/${item.id}`, {
      method: "DELETE",
    });
    const payload = await parseApi<{ deleted: boolean }>(response);

    if (!payload.ok) {
      setMessage(payload.message);
      return;
    }

    if (selected?.id === item.id) startCreate();
    setMessage(`${config.singularLabel} deleted.`);
    await load();
  }

  async function uploadFile(file: File) {
    setUploading(true);
    setMessage(null);

    try {
      const signatureResponse = await fetch("/api/admin/media/upload-signature", {
        method: "POST",
      });
      const signaturePayload = await parseApi<AdminMediaUploadSignatureData>(
        signatureResponse,
      );

      if (!signaturePayload.ok) {
        setMessage(signaturePayload.message);
        setUploading(false);
        return;
      }

      const uploaded = await upload({
        file,
        fileName: file.name,
        folder: normalizeImageKitFolder(uploadFolder),
        publicKey: signaturePayload.data.publicKey,
        signature: signaturePayload.data.signature,
        expire: signaturePayload.data.expire,
        token: signaturePayload.data.token,
        useUniqueFileName: true,
        responseFields: ["metadata", "isPublished"],
      });

      if (!uploaded.url) {
        throw new Error("ImageKit did not return a public URL.");
      }

      const resourceType = getResourceType(file, uploaded);
      const response = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: uploaded.url,
          providerFileId: uploaded.fileId ?? null,
          thumbnailUrl: uploaded.thumbnailUrl ?? null,
          resourceType,
          altText: stripExtension(file.name),
          width: uploaded.width ?? uploaded.metadata?.width ?? null,
          height: uploaded.height ?? uploaded.metadata?.height ?? null,
          durationSeconds: uploaded.metadata?.duration ?? null,
          bytes: uploaded.size ?? uploaded.metadata?.size ?? file.size,
          mimeType: file.type || null,
          folder: normalizeImageKitFolder(uploadFolder),
          metadata: uploaded.metadata ?? {},
        }),
      });
      const created = await parseApi<ResourceItem>(response);

      if (!created.ok) {
        setMessage(created.message);
        setUploading(false);
        return;
      }

      setSelected(created.data);
      setForm(toForm(created.data));
      setMessage("Media uploaded and saved.");
      await Promise.all([load(), loadMedia()]);
    } catch (error) {
      console.error("[admin:media-upload]", error);
      setMessage("Media upload failed. Please check the file and try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-brand">{config.eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl font-black text-foreground">
            {config.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-bold text-muted">
            {config.description}
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-brand"
        >
          <Plus size={17} />
          New {config.singularLabel}
        </button>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
        <section className="rounded-lg border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={config.searchPlaceholder ?? "Search"}
              className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm font-bold outline-none transition focus:border-brand"
            />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-bold outline-none transition focus:border-brand"
            >
              <option value="">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <button
              type="button"
              onClick={load}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-black transition hover:border-brand"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left">
              <thead>
                <tr>
                  {config.columns.map((column) => (
                    <th
                      key={column.value}
                      className="border-b border-border px-3 py-3 text-xs font-black uppercase text-muted"
                    >
                      {column.label}
                    </th>
                  ))}
                  <th className="border-b border-border px-3 py-3 text-right text-xs font-black uppercase text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={config.columns.length + 1}
                      className="px-3 py-14 text-center text-sm font-bold text-muted"
                    >
                      Loading {config.title.toLowerCase()}...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={config.columns.length + 1}
                      className="px-3 py-14 text-center text-sm font-bold text-muted"
                    >
                      No records found.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      className={cn(
                        "transition",
                        selected?.id === item.id ? "bg-brand/5" : "hover:bg-background",
                      )}
                    >
                      {config.columns.map((column) => (
                        <td
                          key={`${item.id}-${column.value}`}
                          className="border-b border-border px-3 py-3 align-middle text-sm"
                        >
                          <Cell item={item} column={column} />
                        </td>
                      ))}
                      <td className="border-b border-border px-3 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted transition hover:border-brand hover:text-brand"
                            aria-label={`Edit ${getTitle(item)}`}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(item)}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-danger transition hover:border-danger"
                            aria-label={`Delete ${getTitle(item)}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="rounded-lg border border-border bg-surface p-5 shadow-[var(--shadow-soft)]">
          <div>
            <p className="text-xs font-black uppercase text-brand">
              {selected ? "Edit record" : "Create record"}
            </p>
            <h2 className="mt-1 text-xl font-black text-foreground">
              {selected ? getTitle(selected) : `New ${config.singularLabel}`}
            </h2>
          </div>

          <form onSubmit={submit} className="mt-5 grid gap-4">
            {config.endpoint === "/api/admin/media" ? (
              <div className="rounded-lg border border-dashed border-border bg-background p-3">
                <p className="text-xs font-black uppercase text-brand">
                  Upload to ImageKit
                </p>
                <p className="mt-1 text-xs font-bold leading-5 text-muted">
                  Upload images, GIFs or videos, then the media metadata is saved
                  through the same admin API below.
                </p>
                <div className="mt-3 grid gap-2">
                  <input
                    value={uploadFolder}
                    onChange={(event) => setUploadFolder(event.target.value)}
                    placeholder="Folder"
                    className="h-10 rounded-lg border border-border bg-surface px-3 text-sm font-bold outline-none transition focus:border-brand"
                  />
                  <input
                    type="file"
                    accept="image/*,video/*"
                    disabled={uploading}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) void uploadFile(file);
                    }}
                    className="block w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs font-bold file:mr-3 file:rounded-md file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-xs file:font-black file:text-white"
                  />
                  {uploading ? (
                    <span className="inline-flex items-center gap-2 text-xs font-black text-brand">
                      <Loader2 size={14} className="animate-spin" />
                      Uploading media...
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}

            {config.fields.map((field) => (
              <FieldControl
                key={field.name}
                field={field}
                value={form[field.name] ?? ""}
                mediaItems={mediaItems}
                onChange={(value) =>
                  setForm((current) => ({ ...current, [field.name]: value }))
                }
              />
            ))}

            {message ? (
              <p className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold text-muted">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-black text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}
              Save {config.singularLabel}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}

function FieldControl({
  field,
  value,
  mediaItems,
  onChange,
}: {
  field: AdminResourceField;
  value: string;
  mediaItems: MediaOption[];
  onChange: (value: string) => void;
}) {
  const label = (
    <span>
      {field.label}
      {field.required ? <span className="text-danger"> *</span> : null}
    </span>
  );

  if (field.type === "textarea") {
    return (
      <label className="grid gap-2 text-xs font-black uppercase text-muted">
        {label}
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={field.placeholder}
          rows={4}
          className="min-h-28 rounded-lg border border-border bg-background px-3 py-3 text-sm font-bold normal-case text-foreground outline-none transition focus:border-brand"
        />
        {field.helpText ? <HelpText>{field.helpText}</HelpText> : null}
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="grid gap-2 text-xs font-black uppercase text-muted">
        {label}
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-bold normal-case text-foreground outline-none transition focus:border-brand"
        >
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {field.helpText ? <HelpText>{field.helpText}</HelpText> : null}
      </label>
    );
  }

  if (field.type === "media") {
    const allowed = field.mediaResourceTypes;
    const options = allowed?.length
      ? mediaItems.filter((item) => allowed.includes(item.resourceType))
      : mediaItems;
    const selectedMedia = mediaItems.find((item) => item.id === value);

    return (
      <label className="grid gap-2 text-xs font-black uppercase text-muted">
        {label}
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-bold normal-case text-foreground outline-none transition focus:border-brand"
        >
          <option value="">No media selected</option>
          {options.map((media) => (
            <option key={media.id} value={media.id}>
              {media.altText || media.url.split("/").pop() || media.id} ({media.resourceType})
            </option>
          ))}
        </select>
        {selectedMedia ? (
          <span className="flex items-center gap-3 rounded-lg border border-border bg-background p-2 normal-case text-foreground">
            <MediaThumb media={selectedMedia} />
            <span className="min-w-0 text-xs font-bold">
              <span className="block truncate">{selectedMedia.altText ?? selectedMedia.url}</span>
              <span className="mt-0.5 block uppercase text-muted">
                {selectedMedia.resourceType}
              </span>
            </span>
          </span>
        ) : null}
        {field.helpText ? <HelpText>{field.helpText}</HelpText> : null}
      </label>
    );
  }

  return (
    <label className="grid gap-2 text-xs font-black uppercase text-muted">
      {label}
      <input
        value={value}
        type={field.type === "number" ? "number" : "text"}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
        className="h-11 rounded-lg border border-border bg-background px-3 text-sm font-bold normal-case text-foreground outline-none transition focus:border-brand"
      />
      {field.helpText ? <HelpText>{field.helpText}</HelpText> : null}
    </label>
  );
}

function Cell({ item, column }: { item: ResourceItem; column: AdminResourceColumn }) {
  const value = column.value ? getValue(item, column.value) : item;

  if (column.kind === "media") {
    const media = value as MediaOption | null;
    return media ? <MediaThumb media={media} /> : <span className="text-muted">None</span>;
  }

  if (column.kind === "status") {
    return (
      <span
        className={cn(
          "inline-flex rounded-full px-2 py-1 text-[11px] font-black uppercase",
          value === "published"
            ? "bg-success/10 text-success"
            : value === "archived"
              ? "bg-danger/10 text-danger"
              : "bg-muted/10 text-muted",
        )}
      >
        {String(value ?? "draft")}
      </span>
    );
  }

  return (
    <span className="line-clamp-2 font-bold text-foreground">
      {value === null || value === undefined || value === "" ? "—" : String(value)}
    </span>
  );
}

function MediaThumb({ media }: { media: MediaOption }) {
  const src = media.thumbnailUrl ?? media.url;

  if (media.resourceType === "video") {
    return (
      <span className="relative grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-slate-950 text-white">
        <ImageIcon size={17} />
      </span>
    );
  }

  return (
    <span className="block h-12 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-background">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={media.altText ?? ""}
        className="h-full w-full object-cover"
      />
    </span>
  );
}

function HelpText({ children }: { children: React.ReactNode }) {
  return <span className="normal-case leading-5 text-muted">{children}</span>;
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

function toForm(values: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      value === null || value === undefined ? "" : String(value),
    ]),
  );
}

function buildPayload(
  fields: AdminResourceField[],
  form: Record<string, string>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const field of fields) {
    const raw = form[field.name] ?? "";

    if (field.type === "number") {
      payload[field.name] = raw.trim() === "" ? undefined : Number(raw);
      continue;
    }

    if (field.type === "media") {
      payload[field.name] = raw.trim() === "" ? null : raw.trim();
      continue;
    }

    payload[field.name] = raw.trim() === "" && !field.required ? null : raw;
  }

  return payload;
}

function getTitle(item: ResourceItem) {
  const title = item.title ?? item.name ?? item.label ?? item.siteName ?? item.id;
  return String(title);
}

function getValue(item: ResourceItem, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, item);
}

function normalizeImageKitFolder(value: string) {
  const cleaned = value
    .trim()
    .replaceAll("\\", "/")
    .replace(/[^a-zA-Z0-9/_-]/g, "-")
    .replace(/\/+/g, "/")
    .replace(/^\/|\/$/g, "");

  return cleaned || "cms";
}

function stripExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || fileName;
}

function getResourceType(
  file: File,
  uploaded: UploadResponse,
): MediaResourceType {
  if (file.type === "image/gif" || uploaded.url?.toLowerCase().endsWith(".gif")) {
    return "gif";
  }

  if (file.type.startsWith("video/")) {
    return "video";
  }

  if (file.type.startsWith("image/")) {
    return "image";
  }

  return "file";
}
