import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  createAdminHeroSlide,
  listAdminHeroSlides,
} from "@/server/admin/hero-slides-dal";
import { buildRateLimitKey, checkRateLimit } from "@/server/http/rate-limit";
import {
  apiForbidden,
  apiInternalError,
  apiOk,
  apiRateLimited,
  apiUnauthorized,
  apiValidationError,
} from "@/server/http/response";
import { readJsonObject, validateBody } from "@/server/http/validation";
import type { PublishStatus } from "@/types/api";
import type { TablesInsert } from "@/types/supabase";

const publishStatusSchema = z.enum(["draft", "published", "archived"]);
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

const createSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    eyebrow: nullableText(120),
    description: nullableText(500),
    offer: nullableText(160),
    ctaLabel: nullableText(80),
    href: nullableText(500),
    mediaId: z.string().uuid().nullable().optional(),
    status: publishStatusSchema.default("draft"),
    sortOrder: z.number().int().min(0).max(100_000).default(0),
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

export async function GET(request: NextRequest) {
  try {
    await requireAdminActor("editor");
    const p = request.nextUrl.searchParams;
    const result = await listAdminHeroSlides({
      page: p.get("page"),
      pageSize: p.get("pageSize"),
      q: p.get("q"),
      status: parseStatus(p.get("status")),
    });
    return apiOk(result);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-hero-slides:get");
  }
}

export async function POST(request: NextRequest) {
  try {
    const rl = checkRateLimit({
      key: buildRateLimitKey(request, "admin-hero-slide-create"),
      limit: 60,
      windowMs: 60_000,
    });
    if (!rl.allowed) return apiRateLimited();
    const actor = await requireAdminActor("editor");
    const body = await readJsonObject(request);
    const v = validateBody(createSchema, body);
    if (!v.ok) return apiValidationError();

    const input: TablesInsert<"hero_slides"> = {
      title: v.data.title,
      eyebrow: v.data.eyebrow ?? null,
      description: v.data.description ?? null,
      offer: v.data.offer ?? null,
      cta_label: v.data.ctaLabel ?? null,
      href: v.data.href ?? null,
      media_id: v.data.mediaId ?? null,
      status: v.data.status,
      sort_order: v.data.sortOrder,
      starts_at: v.data.startsAt ?? null,
      ends_at: v.data.endsAt ?? null,
    };
    const created = await createAdminHeroSlide(input);
    await writeAuditLog({
      actor,
      action: "hero_slide.created",
      entityTable: "hero_slides",
      entityId: created.id,
      after: created,
      request,
    });
    revalidateTag("home-page", { expire: 0 });
    return apiOk(created, { status: 201 });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-hero-slides:post");
  }
}

function parseStatus(v: string | null): PublishStatus | null {
  const r = publishStatusSchema.safeParse(v);
  return r.success ? r.data : null;
}
