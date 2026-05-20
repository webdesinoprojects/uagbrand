import { revalidateTag } from "next/cache";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  deleteAdminTrustCard,
  getAdminTrustCardById,
  updateAdminTrustCard,
} from "@/server/admin/trust-cards-dal";
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
  title: z.string().trim().min(1).max(120).optional(),
  description: nullableText(500),
  metric: nullableText(80),
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
      return apiNotFound("We could not find that trust card.");
    }
    const item = await getAdminTrustCardById(id);
    if (!item) return apiNotFound("We could not find that trust card.");
    return apiOk(item);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-trust-card-detail:get");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rl = checkRateLimit({
      key: buildRateLimitKey(request, "admin-trust-card-update"),
      limit: 60,
      windowMs: 60_000,
    });
    if (!rl.allowed) return apiRateLimited();
    const actor = await requireAdminActor("editor");
    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that trust card.");
    }
    const body = await readJsonObject(request);
    const v = validateBody(updateSchema, body);
    if (!v.ok) return apiValidationError();

    const updates: TablesUpdate<"trust_cards"> = {};
    if (v.data.title !== undefined) updates.title = v.data.title;
    if (v.data.description !== undefined) updates.description = v.data.description;
    if (v.data.metric !== undefined) updates.metric = v.data.metric;
    if (v.data.status !== undefined) updates.status = v.data.status;
    if (v.data.sortOrder !== undefined) updates.sort_order = v.data.sortOrder;
    if (Object.keys(updates).length === 0) {
      return apiValidationError("Provide at least one field to update.");
    }

    const before = await getAdminTrustCardById(id);
    if (!before) return apiNotFound("We could not find that trust card.");
    const after = await updateAdminTrustCard(id, updates);
    if (!after) return apiNotFound("We could not find that trust card.");

    await writeAuditLog({
      actor,
      action: "trust_card.updated",
      entityTable: "trust_cards",
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
    return apiInternalError(error, "admin-trust-card-detail:patch");
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rl = checkRateLimit({
      key: buildRateLimitKey(request, "admin-trust-card-delete"),
      limit: 30,
      windowMs: 60_000,
    });
    if (!rl.allowed) return apiRateLimited();
    const actor = await requireAdminActor("editor");
    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that trust card.");
    }
    const before = await getAdminTrustCardById(id);
    if (!before) return apiNotFound("We could not find that trust card.");
    const deleted = await deleteAdminTrustCard(id);
    if (!deleted) return apiNotFound("We could not find that trust card.");
    await writeAuditLog({
      actor,
      action: "trust_card.deleted",
      entityTable: "trust_cards",
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
    return apiInternalError(error, "admin-trust-card-detail:delete");
  }
}
