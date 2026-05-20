import { revalidateTag } from "next/cache";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  deleteAdminWarehouseSlide,
  getAdminWarehouseSlideById,
  updateAdminWarehouseSlide,
} from "@/server/admin/warehouse-slides-dal";
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
  href: nullableText(500),
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
      return apiNotFound("We could not find that warehouse slide.");
    }
    const item = await getAdminWarehouseSlideById(id);
    if (!item) return apiNotFound("We could not find that warehouse slide.");
    return apiOk(item);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-warehouse-slide-detail:get");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rl = checkRateLimit({
      key: buildRateLimitKey(request, "admin-warehouse-slide-update"),
      limit: 60,
      windowMs: 60_000,
    });
    if (!rl.allowed) return apiRateLimited();
    const actor = await requireAdminActor("editor");
    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that warehouse slide.");
    }
    const body = await readJsonObject(request);
    const v = validateBody(updateSchema, body);
    if (!v.ok) return apiValidationError();

    const updates: TablesUpdate<"warehouse_slides"> = {};
    if (v.data.title !== undefined) updates.title = v.data.title;
    if (v.data.subtitle !== undefined) updates.subtitle = v.data.subtitle;
    if (v.data.href !== undefined) updates.href = v.data.href;
    if (v.data.mediaId !== undefined) updates.media_id = v.data.mediaId;
    if (v.data.status !== undefined) updates.status = v.data.status;
    if (v.data.sortOrder !== undefined) updates.sort_order = v.data.sortOrder;
    if (Object.keys(updates).length === 0) {
      return apiValidationError("Provide at least one field to update.");
    }

    const before = await getAdminWarehouseSlideById(id);
    if (!before) return apiNotFound("We could not find that warehouse slide.");
    const after = await updateAdminWarehouseSlide(id, updates);
    if (!after) return apiNotFound("We could not find that warehouse slide.");

    await writeAuditLog({
      actor,
      action: "warehouse_slide.updated",
      entityTable: "warehouse_slides",
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
    return apiInternalError(error, "admin-warehouse-slide-detail:patch");
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rl = checkRateLimit({
      key: buildRateLimitKey(request, "admin-warehouse-slide-delete"),
      limit: 30,
      windowMs: 60_000,
    });
    if (!rl.allowed) return apiRateLimited();
    const actor = await requireAdminActor("editor");
    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that warehouse slide.");
    }
    const before = await getAdminWarehouseSlideById(id);
    if (!before) return apiNotFound("We could not find that warehouse slide.");
    const deleted = await deleteAdminWarehouseSlide(id);
    if (!deleted) return apiNotFound("We could not find that warehouse slide.");
    await writeAuditLog({
      actor,
      action: "warehouse_slide.deleted",
      entityTable: "warehouse_slides",
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
    return apiInternalError(error, "admin-warehouse-slide-detail:delete");
  }
}
