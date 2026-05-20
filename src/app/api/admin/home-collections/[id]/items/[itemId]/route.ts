import { revalidateTag } from "next/cache";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  asJsonObject,
  deleteAdminCollectionItem,
  getAdminCollectionItemById,
  updateAdminCollectionItem,
} from "@/server/admin/home-collections-dal";
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
  productId: z.string().uuid().nullable().optional(),
  title: nullableText(200),
  badge: nullableText(80),
  feature: nullableText(160),
  href: nullableText(500),
  mediaId: z.string().uuid().nullable().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  status: publishStatusSchema.optional(),
  sortOrder: z.number().int().min(0).max(100_000).optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    await requireAdminActor("editor");
    const { id: collectionId, itemId } = await context.params;
    if (
      !idParamSchema.safeParse(collectionId).success ||
      !idParamSchema.safeParse(itemId).success
    ) {
      return apiNotFound("We could not find that collection item.");
    }
    const item = await getAdminCollectionItemById(collectionId, itemId);
    if (!item) return apiNotFound("We could not find that collection item.");
    return apiOk(item);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-collection-item-detail:get");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const rl = checkRateLimit({
      key: buildRateLimitKey(request, "admin-collection-item-update"),
      limit: 60,
      windowMs: 60_000,
    });
    if (!rl.allowed) return apiRateLimited();
    const actor = await requireAdminActor("editor");
    const { id: collectionId, itemId } = await context.params;
    if (
      !idParamSchema.safeParse(collectionId).success ||
      !idParamSchema.safeParse(itemId).success
    ) {
      return apiNotFound("We could not find that collection item.");
    }
    const body = await readJsonObject(request);
    const v = validateBody(updateSchema, body);
    if (!v.ok) return apiValidationError();

    const updates: TablesUpdate<"collection_items"> = {};
    if (v.data.productId !== undefined) updates.product_id = v.data.productId;
    if (v.data.title !== undefined) updates.title = v.data.title;
    if (v.data.badge !== undefined) updates.badge = v.data.badge;
    if (v.data.feature !== undefined) updates.feature = v.data.feature;
    if (v.data.href !== undefined) updates.href = v.data.href;
    if (v.data.mediaId !== undefined) updates.media_id = v.data.mediaId;
    if (v.data.payload !== undefined) updates.payload = asJsonObject(v.data.payload);
    if (v.data.status !== undefined) updates.status = v.data.status;
    if (v.data.sortOrder !== undefined) updates.sort_order = v.data.sortOrder;
    if (Object.keys(updates).length === 0) {
      return apiValidationError("Provide at least one field to update.");
    }

    const before = await getAdminCollectionItemById(collectionId, itemId);
    if (!before) return apiNotFound("We could not find that collection item.");
    const after = await updateAdminCollectionItem(collectionId, itemId, updates);
    if (!after) return apiNotFound("We could not find that collection item.");

    await writeAuditLog({
      actor,
      action: "collection_item.updated",
      entityTable: "collection_items",
      entityId: itemId,
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
    return apiInternalError(error, "admin-collection-item-detail:patch");
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const rl = checkRateLimit({
      key: buildRateLimitKey(request, "admin-collection-item-delete"),
      limit: 30,
      windowMs: 60_000,
    });
    if (!rl.allowed) return apiRateLimited();
    const actor = await requireAdminActor("editor");
    const { id: collectionId, itemId } = await context.params;
    if (
      !idParamSchema.safeParse(collectionId).success ||
      !idParamSchema.safeParse(itemId).success
    ) {
      return apiNotFound("We could not find that collection item.");
    }
    const before = await getAdminCollectionItemById(collectionId, itemId);
    if (!before) return apiNotFound("We could not find that collection item.");
    const deleted = await deleteAdminCollectionItem(collectionId, itemId);
    if (!deleted) return apiNotFound("We could not find that collection item.");
    await writeAuditLog({
      actor,
      action: "collection_item.deleted",
      entityTable: "collection_items",
      entityId: itemId,
      before,
      request,
    });
    revalidateTag("home-page", { expire: 0 });
    return apiOk({ id: itemId, deleted: true });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-collection-item-detail:delete");
  }
}
