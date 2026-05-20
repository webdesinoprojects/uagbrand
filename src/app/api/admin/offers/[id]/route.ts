import { revalidateTag } from "next/cache";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  deleteAdminOffer,
  getAdminOfferById,
  updateAdminOffer,
} from "@/server/admin/offers-dal";
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
    (value) =>
      typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().max(max).nullable().optional(),
  );
const nullableInt = (min: number, max: number) =>
  z.preprocess(
    (value) => (value === "" || value === null ? null : value),
    z.number().int().min(min).max(max).nullable().optional(),
  );
const nullableNumber = (min: number, max: number) =>
  z.preprocess(
    (value) => (value === "" || value === null ? null : value),
    z.number().min(min).max(max).nullable().optional(),
  );
const nullableDatetime = () =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? null : value,
    z.string().datetime().nullable().optional(),
  );

const updateOfferSchema = z
  .object({
    label: nullableText(80),
    title: z.string().trim().min(1).max(200).optional(),
    value: z.string().trim().min(1).max(200).optional(),
    code: nullableText(60),
    minQuantity: nullableInt(1, 1000),
    discountPercent: nullableNumber(0, 100),
    startsAt: nullableDatetime(),
    endsAt: nullableDatetime(),
    status: publishStatusSchema.optional(),
  })
  .refine(
    (value) =>
      !value.startsAt ||
      !value.endsAt ||
      new Date(value.endsAt).getTime() > new Date(value.startsAt).getTime(),
    { message: "endsAt must be after startsAt" },
  );

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminActor("editor");

    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that offer.");
    }

    const offer = await getAdminOfferById(id);
    if (!offer) {
      return apiNotFound("We could not find that offer.");
    }

    return apiOk(offer);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-offer-detail:get");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-offer-update"),
      limit: 60,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const actor = await requireAdminActor("editor");

    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that offer.");
    }

    const body = await readJsonObject(request);
    const validation = validateBody(updateOfferSchema, body);
    if (!validation.ok) {
      return apiValidationError();
    }

    const updates: TablesUpdate<"offers"> = {};
    if (validation.data.label !== undefined) updates.label = validation.data.label;
    if (validation.data.title !== undefined) updates.title = validation.data.title;
    if (validation.data.value !== undefined) updates.value = validation.data.value;
    if (validation.data.code !== undefined) updates.code = validation.data.code;
    if (validation.data.minQuantity !== undefined)
      updates.min_quantity = validation.data.minQuantity;
    if (validation.data.discountPercent !== undefined)
      updates.discount_percent = validation.data.discountPercent;
    if (validation.data.startsAt !== undefined)
      updates.starts_at = validation.data.startsAt;
    if (validation.data.endsAt !== undefined)
      updates.ends_at = validation.data.endsAt;
    if (validation.data.status !== undefined) updates.status = validation.data.status;

    if (Object.keys(updates).length === 0) {
      return apiValidationError("Provide at least one field to update.");
    }

    const before = await getAdminOfferById(id);
    if (!before) {
      return apiNotFound("We could not find that offer.");
    }

    const after = await updateAdminOffer(id, updates);
    if (!after) {
      return apiNotFound("We could not find that offer.");
    }

    await writeAuditLog({
      actor,
      action: "offer.updated",
      entityTable: "offers",
      entityId: id,
      before,
      after,
      request,
    });
    revalidateOfferTags();

    return apiOk(after);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-offer-detail:patch");
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-offer-delete"),
      limit: 30,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const actor = await requireAdminActor("editor");

    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that offer.");
    }

    const before = await getAdminOfferById(id);
    if (!before) {
      return apiNotFound("We could not find that offer.");
    }

    const deleted = await deleteAdminOffer(id);
    if (!deleted) {
      return apiNotFound("We could not find that offer.");
    }

    await writeAuditLog({
      actor,
      action: "offer.deleted",
      entityTable: "offers",
      entityId: id,
      before,
      request,
    });
    revalidateOfferTags();

    return apiOk({ id, deleted: true });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-offer-detail:delete");
  }
}

function revalidateOfferTags() {
  revalidateTag("products", { expire: 0 });
  revalidateTag("home-page", { expire: 0 });
}
