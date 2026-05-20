import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  deleteAdminMedia,
  getAdminMediaById,
  updateAdminMedia,
} from "@/server/admin/media-dal";
import { buildRateLimitKey, checkRateLimit } from "@/server/http/rate-limit";
import {
  apiForbidden,
  apiInternalError,
  apiNotFound,
  apiOk,
  apiRateLimited,
  apiUnauthorized,
  apiValidationError,
} from "@/server/http/response";
import { readJsonObject, validateBody } from "@/server/http/validation";
import type { Json, TablesUpdate } from "@/types/supabase";

const updateMediaSchema = z.object({
  altText: z.string().max(500).nullish(),
  folder: z.string().max(255).nullish(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const idParamSchema = z.string().uuid();

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminActor("editor");

    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that media asset.");
    }

    const media = await getAdminMediaById(id);

    if (!media) {
      return apiNotFound("We could not find that media asset.");
    }

    return apiOk(media);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-media-detail:get");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-media-update"),
      limit: 60,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const actor = await requireAdminActor("editor");

    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that media asset.");
    }

    const body = await readJsonObject(request);
    const validation = validateBody(updateMediaSchema, body);

    if (!validation.ok) {
      return apiValidationError();
    }

    const updates: TablesUpdate<"media_assets"> = {};
    if (validation.data.altText !== undefined) {
      updates.alt_text = validation.data.altText;
    }
    if (validation.data.folder !== undefined) {
      updates.folder = validation.data.folder;
    }
    if (validation.data.metadata !== undefined) {
      updates.metadata = JSON.parse(
        JSON.stringify(validation.data.metadata),
      ) as Json;
    }

    if (Object.keys(updates).length === 0) {
      return apiValidationError("Provide at least one field to update.");
    }

    const before = await getAdminMediaById(id);
    if (!before) {
      return apiNotFound("We could not find that media asset.");
    }

    const after = await updateAdminMedia(id, updates);
    if (!after) {
      return apiNotFound("We could not find that media asset.");
    }

    await writeAuditLog({
      actor,
      action: "media.updated",
      entityTable: "media_assets",
      entityId: id,
      before,
      after,
      request,
    });

    return apiOk(after);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-media-detail:patch");
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-media-delete"),
      limit: 30,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const actor = await requireAdminActor("editor");

    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that media asset.");
    }

    const before = await getAdminMediaById(id);
    if (!before) {
      return apiNotFound("We could not find that media asset.");
    }

    const deleted = await deleteAdminMedia(id);
    if (!deleted) {
      return apiNotFound("We could not find that media asset.");
    }

    await writeAuditLog({
      actor,
      action: "media.deleted",
      entityTable: "media_assets",
      entityId: id,
      before,
      request,
    });

    return apiOk({ id, deleted: true });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-media-detail:delete");
  }
}
