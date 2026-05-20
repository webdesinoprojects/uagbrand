import { revalidateTag } from "next/cache";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  deleteAdminBrandCollab,
  getAdminBrandCollabById,
  updateAdminBrandCollab,
} from "@/server/admin/brand-collabs-dal";
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
import type { TablesUpdate } from "@/types/supabase";

const publishStatusSchema = z.enum(["draft", "published", "archived"]);
const idParamSchema = z.string().uuid();
const nullableText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(max).nullable().optional(),
  );

const updateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  subtitle: nullableText(300),
  brandId: z.string().uuid().nullable().optional(),
  mediaId: z.string().uuid().nullable().optional(),
  status: publishStatusSchema.optional(),
  sortOrder: z.number().int().min(0).max(100_000).optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminActor("editor");
    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that brand collab.");
    }
    const item = await getAdminBrandCollabById(id);
    if (!item) return apiNotFound("We could not find that brand collab.");
    return apiOk(item);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-brand-collab-detail:get");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rl = checkRateLimit({
      key: buildRateLimitKey(request, "admin-brand-collab-update"),
      limit: 60,
      windowMs: 60_000,
    });
    if (!rl.allowed) return apiRateLimited();
    const actor = await requireAdminActor("editor");
    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that brand collab.");
    }
    const body = await readJsonObject(request);
    const v = validateBody(updateSchema, body);
    if (!v.ok) return apiValidationError();

    const updates: TablesUpdate<"brand_collabs"> = {};
    if (v.data.title !== undefined) updates.title = v.data.title;
    if (v.data.subtitle !== undefined) updates.subtitle = v.data.subtitle;
    if (v.data.brandId !== undefined) updates.brand_id = v.data.brandId;
    if (v.data.mediaId !== undefined) updates.media_id = v.data.mediaId;
    if (v.data.status !== undefined) updates.status = v.data.status;
    if (v.data.sortOrder !== undefined) updates.sort_order = v.data.sortOrder;
    if (Object.keys(updates).length === 0) {
      return apiValidationError("Provide at least one field to update.");
    }

    const before = await getAdminBrandCollabById(id);
    if (!before) return apiNotFound("We could not find that brand collab.");
    const after = await updateAdminBrandCollab(id, updates);
    if (!after) return apiNotFound("We could not find that brand collab.");

    await writeAuditLog({
      actor,
      action: "brand_collab.updated",
      entityTable: "brand_collabs",
      entityId: id,
      before,
      after,
      request,
    });
    revalidateTag("home-page", { expire: 0 });
    return apiOk(after);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-brand-collab-detail:patch");
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rl = checkRateLimit({
      key: buildRateLimitKey(request, "admin-brand-collab-delete"),
      limit: 30,
      windowMs: 60_000,
    });
    if (!rl.allowed) return apiRateLimited();
    const actor = await requireAdminActor("editor");
    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that brand collab.");
    }
    const before = await getAdminBrandCollabById(id);
    if (!before) return apiNotFound("We could not find that brand collab.");
    const deleted = await deleteAdminBrandCollab(id);
    if (!deleted) return apiNotFound("We could not find that brand collab.");
    await writeAuditLog({
      actor,
      action: "brand_collab.deleted",
      entityTable: "brand_collabs",
      entityId: id,
      before,
      request,
    });
    revalidateTag("home-page", { expire: 0 });
    return apiOk({ id, deleted: true });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-brand-collab-detail:delete");
  }
}
