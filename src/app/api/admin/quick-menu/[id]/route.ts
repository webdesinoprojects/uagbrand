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

const idParamSchema = z.string().uuid();
const publishStatusSchema = z.enum(["draft", "published", "archived"]);

const updateQuickMenuSchema = z.object({
  label: z.string().trim().min(1).max(80).optional(),
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

    const item = await getQuickMenuItem(context);
    if (!item) return apiNotFound("We could not find that quick menu card.");
    return apiOk(item);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-quick-menu-detail:get");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-quick-menu-update"),
      limit: 60,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) return apiRateLimited();

    const actor = await requireAdminActor("editor");
    const before = await getQuickMenuItem(context);
    if (!before) return apiNotFound("We could not find that quick menu card.");

    const body = await readJsonObject(request);
    const validation = validateBody(updateQuickMenuSchema, body);
    if (!validation.ok) return apiValidationError();

    const updates: TablesUpdate<"navigation_items"> = {};
    if (validation.data.label !== undefined) updates.label = validation.data.label;
    if (validation.data.href !== undefined) updates.href = validation.data.href;
    if (validation.data.status !== undefined) updates.status = validation.data.status;
    if (validation.data.sortOrder !== undefined) {
      updates.sort_order = validation.data.sortOrder;
    }

    if (Object.keys(updates).length === 0) {
      return apiValidationError("Provide at least one field to update.");
    }

    const after = await updateAdminNavigationItem(before.id, updates);
    if (!after || after.location !== "quick_menu") {
      return apiNotFound("We could not find that quick menu card.");
    }

    await writeAuditLog({
      actor,
      action: "quick_menu_item.updated",
      entityTable: "navigation_items",
      entityId: before.id,
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
    return apiInternalError(error, "admin-quick-menu-detail:patch");
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-quick-menu-delete"),
      limit: 30,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) return apiRateLimited();

    const actor = await requireAdminActor("editor");
    const before = await getQuickMenuItem(context);
    if (!before) return apiNotFound("We could not find that quick menu card.");

    const deleted = await deleteAdminNavigationItem(before.id);
    if (!deleted) return apiNotFound("We could not find that quick menu card.");

    await writeAuditLog({
      actor,
      action: "quick_menu_item.deleted",
      entityTable: "navigation_items",
      entityId: before.id,
      before,
      request,
    });
    revalidateTag("home-page", { expire: 0 });

    return apiOk({ id: before.id, deleted: true });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-quick-menu-detail:delete");
  }
}

async function getQuickMenuItem(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!idParamSchema.safeParse(id).success) {
    return null;
  }

  const item = await getAdminNavigationItemById(id);
  return item?.location === "quick_menu" ? item : null;
}
