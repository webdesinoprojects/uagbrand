import type { NextRequest } from "next/server";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  createAdminMedia,
  listAdminMedia,
  parseResourceType,
} from "@/server/admin/media-dal";
import { buildRateLimitKey, checkRateLimit } from "@/server/http/rate-limit";
import {
  apiForbidden,
  apiInternalError,
  apiOk,
  apiRateLimited,
  apiUnauthorized,
  apiValidationError,
} from "@/server/http/response";
import { readJsonObject, validateBody } from "@/server/http/validation";
import type { Json } from "@/types/supabase";

const resourceTypeSchema = z.enum(["image", "video", "gif", "file"]);

const createMediaSchema = z.object({
  url: z.string().url().max(2048),
  providerFileId: z.string().max(256).nullish(),
  thumbnailUrl: z.string().url().max(2048).nullish(),
  resourceType: resourceTypeSchema.default("image"),
  altText: z.string().max(500).nullish(),
  width: z.number().int().nonnegative().max(20000).nullish(),
  height: z.number().int().nonnegative().max(20000).nullish(),
  durationSeconds: z.number().nonnegative().max(86400).nullish(),
  bytes: z.number().int().nonnegative().nullish(),
  mimeType: z.string().max(255).nullish(),
  folder: z.string().max(255).nullish(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminActor("editor");

    const params = request.nextUrl.searchParams;
    const result = await listAdminMedia({
      page: params.get("page"),
      pageSize: params.get("pageSize"),
      folder: params.get("folder"),
      resourceType: parseResourceType(params.get("resourceType")),
      q: params.get("q"),
    });

    return apiOk(result);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-media:get");
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-media-create"),
      limit: 60,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const actor = await requireAdminActor("editor");
    const body = await readJsonObject(request);
    const validation = validateBody(createMediaSchema, body);

    if (!validation.ok) {
      return apiValidationError();
    }

    const created = await createAdminMedia({
      url: validation.data.url,
      provider: "imagekit",
      provider_file_id: validation.data.providerFileId ?? null,
      thumbnail_url: validation.data.thumbnailUrl ?? null,
      resource_type: validation.data.resourceType,
      alt_text: validation.data.altText ?? null,
      width: validation.data.width ?? null,
      height: validation.data.height ?? null,
      duration_seconds: validation.data.durationSeconds ?? null,
      bytes: validation.data.bytes ?? null,
      mime_type: validation.data.mimeType ?? null,
      folder: validation.data.folder ?? null,
      metadata: toJsonObject(validation.data.metadata),
    });

    await writeAuditLog({
      actor,
      action: "media.created",
      entityTable: "media_assets",
      entityId: created.id,
      after: created,
      request,
    });

    return apiOk(created, { status: 201 });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-media:post");
  }
}

function toJsonObject(value: Record<string, unknown> | undefined): Json {
  if (!value) {
    return {} as Json;
  }
  return JSON.parse(JSON.stringify(value)) as Json;
}
