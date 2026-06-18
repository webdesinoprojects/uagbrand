"use client";

import { upload, type UploadResponse } from "@imagekit/next";
import { Loader2, UploadCloud, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import type {
  AdminMediaAsset,
  AdminMediaUploadSignatureData,
  MediaResourceType,
} from "@/types/api";

type ApiEnvelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

type QueueItem = {
  id: string;
  file: File;
  altText: string;
  status: "queued" | "uploading" | "saving" | "complete" | "error";
  progress: number;
  error: string | null;
  asset?: AdminMediaAsset;
};

type Props = {
  defaultFolder?: string;
};

const REFRESH_EVENT = "admin-resource-refresh";

export function MediaUploaderClient({ defaultFolder = "cms" }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [folder, setFolder] = useState(defaultFolder);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const incoming = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      altText: stripExtension(file.name),
      status: "queued" as const,
      progress: 0,
      error: null,
    }));

    if (incoming.length === 0) return;

    setQueue((current) => [...incoming, ...current]);
    setGlobalMessage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  function updateItem(id: string, update: Partial<QueueItem>) {
    setQueue((current) =>
      current.map((item) => (item.id === id ? { ...item, ...update } : item)),
    );
  }

  function removeItem(id: string) {
    setQueue((current) => current.filter((item) => item.id !== id));
  }

  function clearCompleted() {
    setQueue((current) => current.filter((item) => item.status !== "complete"));
  }

  async function processQueue() {
    if (isUploading) return;

    // Snapshot queued+error items at start so newly added files during the run
    // don't get picked up until the next click.
    const pending = queue.filter(
      (item) => item.status === "queued" || item.status === "error",
    );
    if (pending.length === 0) return;

    setIsUploading(true);
    setGlobalMessage(null);

    const normalizedFolder = normalizeImageKitFolder(folder);
    let successCount = 0;

    for (const item of pending) {
      try {
        updateItem(item.id, { status: "uploading", progress: 5, error: null });

        const signatureResponse = await fetch(
          "/api/admin/media/upload-signature",
          { method: "POST" },
        );
        const signaturePayload = (await signatureResponse.json()) as ApiEnvelope<AdminMediaUploadSignatureData>;
        if (!signaturePayload.ok) {
          throw new Error(signaturePayload.error.message);
        }

        const uploaded = await upload({
          file: item.file,
          fileName: item.file.name,
          folder: normalizedFolder,
          publicKey: signaturePayload.data.publicKey,
          signature: signaturePayload.data.signature,
          expire: signaturePayload.data.expire,
          token: signaturePayload.data.token,
          useUniqueFileName: true,
          responseFields: ["metadata", "isPublished"],
          onProgress: (event) => {
            if (!event.lengthComputable) return;
            const pct = Math.min(90, Math.round((event.loaded / event.total) * 90));
            updateItem(item.id, { progress: pct });
          },
        });

        if (!uploaded.url) {
          throw new Error("ImageKit did not return a public URL.");
        }

        updateItem(item.id, { status: "saving", progress: 95 });

        const resourceType = getResourceType(item.file, uploaded);
        const registerResponse = await fetch("/api/admin/media", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            url: uploaded.url,
            providerFileId: uploaded.fileId ?? null,
            thumbnailUrl: uploaded.thumbnailUrl ?? null,
            resourceType,
            altText: item.altText || stripExtension(item.file.name),
            width: uploaded.width ?? uploaded.metadata?.width ?? null,
            height: uploaded.height ?? uploaded.metadata?.height ?? null,
            durationSeconds: uploaded.metadata?.duration ?? null,
            bytes: uploaded.size ?? uploaded.metadata?.size ?? item.file.size,
            mimeType: item.file.type || null,
            folder: normalizedFolder,
            metadata: uploaded.metadata ?? {},
          }),
        });
        const created = (await registerResponse.json()) as ApiEnvelope<AdminMediaAsset>;
        if (!created.ok) {
          throw new Error(created.error.message);
        }

        updateItem(item.id, {
          status: "complete",
          progress: 100,
          error: null,
          asset: created.data,
        });
        successCount += 1;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Upload failed. Please try again.";
        updateItem(item.id, { status: "error", progress: 0, error: message });
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      setGlobalMessage(
        `${successCount} of ${pending.length} ${pending.length === 1 ? "file" : "files"} uploaded.`,
      );
      // Notify any AdminResourcePage on /api/admin/media to refresh its list.
      window.dispatchEvent(
        new CustomEvent(REFRESH_EVENT, {
          detail: { endpoint: "/api/admin/media" },
        }),
      );
    } else {
      setGlobalMessage("No files uploaded. Check errors below.");
    }
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-4 sm:p-6">
      <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-brand">
            Bulk upload
          </p>
          <h2 className="mt-1 text-lg font-black text-foreground">
            Drag, drop, or select files
          </h2>
          <p className="mt-1 text-sm text-muted">
            Files upload one by one to ImageKit, then auto-register in the media
            library below.
          </p>
        </div>
        <label className="grid gap-1 text-xs font-bold uppercase text-muted">
          ImageKit folder
          <input
            type="text"
            value={folder}
            onChange={(event) => setFolder(event.target.value)}
            disabled={isUploading}
            className="h-9 w-44 rounded-md border border-border bg-background px-3 text-sm font-bold normal-case text-foreground focus:border-brand focus:outline-none disabled:opacity-60"
          />
        </label>
      </header>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (event.dataTransfer.files?.length) {
            addFiles(event.dataTransfer.files);
          }
        }}
        className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-4 py-10 text-center transition ${
          isDragging
            ? "border-brand bg-brand/5"
            : "border-border bg-surface-soft hover:border-brand/60"
        }`}
      >
        <UploadCloud
          size={32}
          className={isDragging ? "text-brand" : "text-muted"}
        />
        <p className="text-sm font-bold text-foreground">
          Drop images, videos, GIFs or files here
        </p>
        <p className="text-xs text-muted">
          You can select multiple files. Resource type is auto-detected.
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-1 inline-flex h-9 items-center justify-center rounded-md bg-brand px-4 text-sm font-black text-white transition hover:bg-brand-strong"
        >
          Browse files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,*/*"
          onChange={(event) => {
            if (event.target.files?.length) {
              addFiles(event.target.files);
            }
          }}
          className="hidden"
        />
      </div>

      {globalMessage ? (
        <p
          className={`mt-4 rounded-md border px-3 py-2 text-sm font-bold ${
            globalMessage.includes("uploaded.") && !globalMessage.startsWith("No")
              ? "border-success bg-success/10 text-success"
              : "border-danger bg-danger/10 text-danger"
          }`}
        >
          {globalMessage}
        </p>
      ) : null}

      {queue.length > 0 ? (
        <>
          <div className="mt-5 flex items-center justify-between gap-2">
            <p className="text-sm font-black text-foreground">
              Upload queue ({queue.length})
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearCompleted}
                disabled={isUploading || queue.every((item) => item.status !== "complete")}
                className="h-9 rounded-md border border-border bg-surface px-3 text-xs font-bold text-foreground transition hover:border-brand disabled:opacity-50"
              >
                Clear completed
              </button>
              <button
                type="button"
                onClick={processQueue}
                disabled={
                  isUploading ||
                  queue.every((item) => item.status === "complete" || item.status === "saving" || item.status === "uploading")
                }
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-foreground px-4 text-xs font-black text-background transition hover:bg-foreground/85 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>Upload all</>
                )}
              </button>
            </div>
          </div>

          <ul className="mt-3 grid gap-2">
            {queue.map((item) => (
              <li
                key={item.id}
                className="rounded-md border border-border bg-surface-soft p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">
                      {item.file.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatBytes(item.file.size)} · {item.file.type || "unknown"} · auto-detected: {getLocalFileResourceType(item.file)}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={item.status === "uploading" || item.status === "saving"}
                    className="grid h-7 w-7 place-items-center rounded-md text-muted transition hover:bg-danger/10 hover:text-danger disabled:opacity-30"
                    aria-label={`Remove ${item.file.name} from queue`}
                  >
                    <X size={14} />
                  </button>
                </div>

                {(item.status === "uploading" || item.status === "saving") ? (
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full bg-brand transition-all"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                ) : null}

                {item.error ? (
                  <p className="mt-2 text-xs font-bold text-danger">{item.error}</p>
                ) : null}

                {item.asset ? (
                  <p className="mt-2 truncate text-xs text-muted">
                    Saved as media id {item.asset.id}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}

function StatusBadge({ status }: { status: QueueItem["status"] }) {
  const styles: Record<QueueItem["status"], string> = {
    queued: "border-border bg-surface text-muted",
    uploading: "border-brand bg-brand/10 text-brand",
    saving: "border-brand bg-brand/10 text-brand",
    complete: "border-success bg-success/10 text-success",
    error: "border-danger bg-danger/10 text-danger",
  };
  const labels: Record<QueueItem["status"], string> = {
    queued: "Queued",
    uploading: "Uploading",
    saving: "Saving",
    complete: "Done",
    error: "Failed",
  };
  return (
    <span
      className={`inline-flex h-6 items-center rounded-md border px-2 text-[10px] font-black uppercase tracking-wide ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
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
  return (
    fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || fileName
  );
}

function getLocalFileResourceType(file: File): MediaResourceType {
  const lowerName = file.name.toLowerCase();
  if (file.type === "image/gif" || lowerName.endsWith(".gif")) return "gif";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("image/")) return "image";
  return "file";
}

function getResourceType(file: File, uploaded: UploadResponse): MediaResourceType {
  const local = getLocalFileResourceType(file);
  if (local !== "file") return local;
  if (uploaded.url?.toLowerCase().endsWith(".gif")) return "gif";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("image/")) return "image";
  return "file";
}
