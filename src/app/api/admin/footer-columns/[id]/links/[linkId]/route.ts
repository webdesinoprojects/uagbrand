import { revalidateTag } from "next/cache";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  deleteAdminFooterLink,
  getAdminFooterLinkById,
  updateAdminFooterLink,
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

const updateLinkSchema = z.object({
  label: z.string().trim().min(1).max(120).optional(),
  href: z.string().trim().min(1).max(500).optional(),
  status: publishStatusSchema.optional(),
  sortOrder: z.number().int().min(0).max(100_000).optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; linkId: string }> },
) {
  try {
    await requireAdminActor("editor");

    const { id: columnId, linkId } = await context.params;
    if (
      !idParamSchema.safeParse(columnId).success ||
      !idParamSchema.safeParse(linkId).success
    ) {
      return apiNotFound("We could not find that footer link.");
    }

    const item = await getAdminFooterLinkById(columnId, linkId);
    if (!item) return apiNotFound("We could not find that footer link.");
    return apiOk(item);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-footer-link-detail:get");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; linkId: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-footer-link-update"),
      limit: 60,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) return apiRateLimited();

    const actor = await requireAdminActor("editor");

    const { id: columnId, linkId } = await context.params;
    if (
      !idParamSchema.safeParse(columnId).success ||
      !idParamSchema.safeParse(linkId).success
    ) {
      return apiNotFound("We could not find that footer link.");
    }

    const body = await readJsonObject(request);
    const validation = validateBody(updateLinkSchema, body);
    if (!validation.ok) return apiValidationError();

    const updates: TablesUpdate<"footer_links"> = {};
    if (validation.data.label !== undefined) updates.label = validation.data.label;
    if (validation.data.href !== undefined) updates.href = validation.data.href;
    if (validation.data.status !== undefined) updates.status = validation.data.status;
    if (validation.data.sortOrder !== undefined) updates.sort_order = validation.data.sortOrder;

    if (Object.keys(updates).length === 0) {
      return apiValidationError("Provide at least one field to update.");
    }

    const before = await getAdminFooterLinkById(columnId, linkId);
    if (!before) return apiNotFound("We could not find that footer link.");

    const after = await updateAdminFooterLink(columnId, linkId, updates);
    if (!after) return apiNotFound("We could not find that footer link.");

    await writeAuditLog({
      actor,
      action: "footer_link.updated",
      entityTable: "footer_links",
      entityId: linkId,
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
    return apiInternalError(error, "admin-footer-link-detail:patch");
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; linkId: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-footer-link-delete"),
      limit: 30,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) return apiRateLimited();

    const actor = await requireAdminActor("editor");

    const { id: columnId, linkId } = await context.params;
    if (
      !idParamSchema.safeParse(columnId).success ||
      !idParamSchema.safeParse(linkId).success
    ) {
      return apiNotFound("We could not find that footer link.");
    }

    const before = await getAdminFooterLinkById(columnId, linkId);
    if (!before) return apiNotFound("We could not find that footer link.");

    const deleted = await deleteAdminFooterLink(columnId, linkId);
    if (!deleted) return apiNotFound("We could not find that footer link.");

    await writeAuditLog({
      actor,
      action: "footer_link.deleted",
      entityTable: "footer_links",
      entityId: linkId,
      before,
      request,
    });
    revalidateTag("site-chrome", { expire: 0 });

    return apiOk({ id: linkId, deleted: true });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-footer-link-detail:delete");
  }
}
