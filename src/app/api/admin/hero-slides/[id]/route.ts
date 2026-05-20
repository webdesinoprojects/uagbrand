import { revalidateTag } from "next/cache";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  deleteAdminHeroSlide,
  getAdminHeroSlideById,
  updateAdminHeroSlide,
} from "@/server/admin/hero-slides-dal";
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
const nullableDatetime = () =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().datetime().nullable().optional(),
  );

const updateSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    eyebrow: nullableText(120),
    description: nullableText(500),
    offer: nullableText(160),
    ctaLabel: nullableText(80),
    href: nullableText(500),
    mediaId: z.string().uuid().nullable().optional(),
    status: publishStatusSchema.optional(),
    sortOrder: z.number().int().min(0).max(100_000).optional(),
    startsAt: nullableDatetime(),
    endsAt: nullableDatetime(),
  })
  .refine(
    (v) =>
      !v.startsAt ||
      !v.endsAt ||
      new Date(v.endsAt).getTime() > new Date(v.startsAt).getTime(),
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
      return apiNotFound("We could not find that hero slide.");
    }
    const item = await getAdminHeroSlideById(id);
    if (!item) return apiNotFound("We could not find that hero slide.");
    return apiOk(item);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-hero-slide-detail:get");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rl = checkRateLimit({
      key: buildRateLimitKey(request, "admin-hero-slide-update"),
      limit: 60,
      windowMs: 60_000,
    });
    if (!rl.allowed) return apiRateLimited();
    const actor = await requireAdminActor("editor");
    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that hero slide.");
    }
    const body = await readJsonObject(request);
    const v = validateBody(updateSchema, body);
    if (!v.ok) return apiValidationError();

    const updates: TablesUpdate<"hero_slides"> = {};
    if (v.data.title !== undefined) updates.title = v.data.title;
    if (v.data.eyebrow !== undefined) updates.eyebrow = v.data.eyebrow;
    if (v.data.description !== undefined) updates.description = v.data.description;
    if (v.data.offer !== undefined) updates.offer = v.data.offer;
    if (v.data.ctaLabel !== undefined) updates.cta_label = v.data.ctaLabel;
    if (v.data.href !== undefined) updates.href = v.data.href;
    if (v.data.mediaId !== undefined) updates.media_id = v.data.mediaId;
    if (v.data.status !== undefined) updates.status = v.data.status;
    if (v.data.sortOrder !== undefined) updates.sort_order = v.data.sortOrder;
    if (v.data.startsAt !== undefined) updates.starts_at = v.data.startsAt;
    if (v.data.endsAt !== undefined) updates.ends_at = v.data.endsAt;
    if (Object.keys(updates).length === 0) {
      return apiValidationError("Provide at least one field to update.");
    }

    const before = await getAdminHeroSlideById(id);
    if (!before) return apiNotFound("We could not find that hero slide.");
    const after = await updateAdminHeroSlide(id, updates);
    if (!after) return apiNotFound("We could not find that hero slide.");

    await writeAuditLog({
      actor,
      action: "hero_slide.updated",
      entityTable: "hero_slides",
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
    return apiInternalError(error, "admin-hero-slide-detail:patch");
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rl = checkRateLimit({
      key: buildRateLimitKey(request, "admin-hero-slide-delete"),
      limit: 30,
      windowMs: 60_000,
    });
    if (!rl.allowed) return apiRateLimited();
    const actor = await requireAdminActor("editor");
    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that hero slide.");
    }
    const before = await getAdminHeroSlideById(id);
    if (!before) return apiNotFound("We could not find that hero slide.");
    const deleted = await deleteAdminHeroSlide(id);
    if (!deleted) return apiNotFound("We could not find that hero slide.");
    await writeAuditLog({
      actor,
      action: "hero_slide.deleted",
      entityTable: "hero_slides",
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
    return apiInternalError(error, "admin-hero-slide-detail:delete");
  }
}
