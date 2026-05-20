import { revalidateTag } from "next/cache";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  deleteAdminNavigationItem,
  getAdminNavigationItemById,
  updateAdminNavigationItem,
} from "@/server/admin/navigation-dal";
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

const updateNavSchema = z.object({
  location: z.string().trim().min(1).max(80).optional(),
  parentId: z.string().uuid().nullable().optional(),
  label: z.string().trim().min(1).max(120).optional(),
  href: z.string().trim().min(1).max(500).optional(),
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
      return apiNotFound("We could not find that menu item.");
    }

    const item = await getAdminNavigationItemById(id);
    if (!item) return apiNotFound("We could not find that menu item.");
    return apiOk(item);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-nav-detail:get");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-nav-update"),
      limit: 60,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) return apiRateLimited();

    const actor = await requireAdminActor("editor");

    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that menu item.");
    }

    const body = await readJsonObject(request);
    const validation = validateBody(updateNavSchema, body);
    if (!validation.ok) return apiValidationError();

    const updates: TablesUpdate<"navigation_items"> = {};
    if (validation.data.location !== undefined) updates.location = validation.data.location;
    if (validation.data.parentId !== undefined) updates.parent_id = validation.data.parentId;
    if (validation.data.label !== undefined) updates.label = validation.data.label;
    if (validation.data.href !== undefined) updates.href = validation.data.href;
    if (validation.data.status !== undefined) updates.status = validation.data.status;
    if (validation.data.sortOrder !== undefined) updates.sort_order = validation.data.sortOrder;

    if (Object.keys(updates).length === 0) {
      return apiValidationError("Provide at least one field to update.");
    }

    const before = await getAdminNavigationItemById(id);
    if (!before) return apiNotFound("We could not find that menu item.");

    if (updates.parent_id === id) {
      return apiValidationError("A menu item cannot be its own parent.");
    }

    const after = await updateAdminNavigationItem(id, updates);
    if (!after) return apiNotFound("We could not find that menu item.");

    await writeAuditLog({
      actor,
      action: "navigation_item.updated",
      entityTable: "navigation_items",
      entityId: id,
      before,
      after,
      request,
    });
    revalidateTag("site-chrome", { expire: 0 });

    return apiOk(after);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-nav-detail:patch");
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-nav-delete"),
      limit: 30,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) return apiRateLimited();

    const actor = await requireAdminActor("editor");

    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that menu item.");
    }

    const before = await getAdminNavigationItemById(id);
    if (!before) return apiNotFound("We could not find that menu item.");

    const deleted = await deleteAdminNavigationItem(id);
    if (!deleted) return apiNotFound("We could not find that menu item.");

    await writeAuditLog({
      actor,
      action: "navigation_item.deleted",
      entityTable: "navigation_items",
      entityId: id,
      before,
      request,
    });
    revalidateTag("site-chrome", { expire: 0 });

    return apiOk({ id, deleted: true });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-nav-detail:delete");
  }
}
