import { revalidateTag } from "next/cache";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  deleteAdminFooterColumn,
  getAdminFooterColumnById,
  updateAdminFooterColumn,
} from "@/server/admin/footer-dal";
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

const updateColumnSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
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
      return apiNotFound("We could not find that footer column.");
    }

    const item = await getAdminFooterColumnById(id);
    if (!item) return apiNotFound("We could not find that footer column.");
    return apiOk(item);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-footer-column-detail:get");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-footer-column-update"),
      limit: 60,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) return apiRateLimited();

    const actor = await requireAdminActor("editor");

    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that footer column.");
    }

    const body = await readJsonObject(request);
    const validation = validateBody(updateColumnSchema, body);
    if (!validation.ok) return apiValidationError();

    const updates: TablesUpdate<"footer_columns"> = {};
    if (validation.data.title !== undefined) updates.title = validation.data.title;
    if (validation.data.status !== undefined) updates.status = validation.data.status;
    if (validation.data.sortOrder !== undefined) updates.sort_order = validation.data.sortOrder;

    if (Object.keys(updates).length === 0) {
      return apiValidationError("Provide at least one field to update.");
    }

    const before = await getAdminFooterColumnById(id);
    if (!before) return apiNotFound("We could not find that footer column.");

    const after = await updateAdminFooterColumn(id, updates);
    if (!after) return apiNotFound("We could not find that footer column.");

    await writeAuditLog({
      actor,
      action: "footer_column.updated",
      entityTable: "footer_columns",
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
    return apiInternalError(error, "admin-footer-column-detail:patch");
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-footer-column-delete"),
      limit: 30,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) return apiRateLimited();

    const actor = await requireAdminActor("editor");

    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that footer column.");
    }

    const before = await getAdminFooterColumnById(id);
    if (!before) return apiNotFound("We could not find that footer column.");

    const deleted = await deleteAdminFooterColumn(id);
    if (!deleted) return apiNotFound("We could not find that footer column.");

    await writeAuditLog({
      actor,
      action: "footer_column.deleted",
      entityTable: "footer_columns",
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
    return apiInternalError(error, "admin-footer-column-detail:delete");
  }
}
