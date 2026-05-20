import { revalidateTag } from "next/cache";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  deleteAdminHomeCollection,
  getAdminHomeCollectionById,
  updateAdminHomeCollection,
} from "@/server/admin/home-collections-dal";
import { buildRateLimitKey, checkRateLimit } from "@/server/http/rate-limit";
import {
  apiConflict,
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
const keySchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const nullableText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(max).nullable().optional(),
  );

const updateSchema = z.object({
  key: keySchema.optional(),
  title: z.string().trim().min(1).max(200).optional(),
  description: nullableText(500),
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
      return apiNotFound("We could not find that home collection.");
    }
    const item = await getAdminHomeCollectionById(id);
    if (!item) return apiNotFound("We could not find that home collection.");
    return apiOk(item);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-home-collection-detail:get");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rl = checkRateLimit({
      key: buildRateLimitKey(request, "admin-home-collection-update"),
      limit: 60,
      windowMs: 60_000,
    });
    if (!rl.allowed) return apiRateLimited();
    const actor = await requireAdminActor("editor");
    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that home collection.");
    }
    const body = await readJsonObject(request);
    const v = validateBody(updateSchema, body);
    if (!v.ok) return apiValidationError();

    const updates: TablesUpdate<"home_collections"> = {};
    if (v.data.key !== undefined) updates.key = v.data.key;
    if (v.data.title !== undefined) updates.title = v.data.title;
    if (v.data.description !== undefined) updates.description = v.data.description;
    if (v.data.status !== undefined) updates.status = v.data.status;
    if (v.data.sortOrder !== undefined) updates.sort_order = v.data.sortOrder;
    if (Object.keys(updates).length === 0) {
      return apiValidationError("Provide at least one field to update.");
    }

    const before = await getAdminHomeCollectionById(id);
    if (!before) return apiNotFound("We could not find that home collection.");
    const after = await updateAdminHomeCollection(id, updates);
    if (!after) return apiNotFound("We could not find that home collection.");

    await writeAuditLog({
      actor,
      action: "home_collection.updated",
      entityTable: "home_collections",
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
    if (isUniqueViolation(error)) {
      return apiConflict("A home collection with that key already exists.");
    }
    return apiInternalError(error, "admin-home-collection-detail:patch");
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rl = checkRateLimit({
      key: buildRateLimitKey(request, "admin-home-collection-delete"),
      limit: 30,
      windowMs: 60_000,
    });
    if (!rl.allowed) return apiRateLimited();
    const actor = await requireAdminActor("editor");
    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that home collection.");
    }
    const before = await getAdminHomeCollectionById(id);
    if (!before) return apiNotFound("We could not find that home collection.");
    const deleted = await deleteAdminHomeCollection(id);
    if (!deleted) return apiNotFound("We could not find that home collection.");
    await writeAuditLog({
      actor,
      action: "home_collection.deleted",
      entityTable: "home_collections",
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
    return apiInternalError(error, "admin-home-collection-detail:delete");
  }
}

function isUniqueViolation(error: unknown) {
  return (error as { code?: unknown } | null)?.code === "23505";
}
