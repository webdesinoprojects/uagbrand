import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  createAdminOffer,
  listAdminOffers,
} from "@/server/admin/offers-dal";
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

const createOfferSchema = z
  .object({
    label: nullableText(80),
    title: z.string().trim().min(1).max(200),
    value: z.string().trim().min(1).max(200),
    code: nullableText(60),
    minQuantity: nullableInt(1, 1000),
    discountPercent: nullableNumber(0, 100),
    startsAt: nullableDatetime(),
    endsAt: nullableDatetime(),
    status: publishStatusSchema.default("draft"),
  })
  .refine(
    (value) =>
      !value.startsAt ||
      !value.endsAt ||
      new Date(value.endsAt).getTime() > new Date(value.startsAt).getTime(),
    { message: "endsAt must be after startsAt" },
  );

export async function GET(request: NextRequest) {
  try {
    await requireAdminActor("editor");

    const params = request.nextUrl.searchParams;
    const result = await listAdminOffers({
      page: params.get("page"),
      pageSize: params.get("pageSize"),
      q: params.get("q"),
      status: parseStatus(params.get("status")),
      productId: params.get("productId"),
    });

    return apiOk(result);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-offers:get");
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-offer-create"),
      limit: 60,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const actor = await requireAdminActor("editor");
    const body = await readJsonObject(request);
    const validation = validateBody(createOfferSchema, body);

    if (!validation.ok) {
      return apiValidationError();
    }

    const input: TablesInsert<"offers"> = {
      label: validation.data.label ?? null,
      title: validation.data.title,
      value: validation.data.value,
      code: validation.data.code ?? null,
      min_quantity: validation.data.minQuantity ?? null,
      discount_percent: validation.data.discountPercent ?? null,
      starts_at: validation.data.startsAt ?? null,
      ends_at: validation.data.endsAt ?? null,
      status: validation.data.status,
    };

    const created = await createAdminOffer(input);
    await writeAuditLog({
      actor,
      action: "offer.created",
      entityTable: "offers",
      entityId: created.id,
      after: created,
      request,
    });
    revalidateOfferTags();

    return apiOk(created, { status: 201 });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-offers:post");
  }
}

function parseStatus(value: string | null): PublishStatus | null {
  const result = publishStatusSchema.safeParse(value);
  return result.success ? result.data : null;
}

function revalidateOfferTags() {
  revalidateTag("products", { expire: 0 });
  revalidateTag("home-page", { expire: 0 });
}
