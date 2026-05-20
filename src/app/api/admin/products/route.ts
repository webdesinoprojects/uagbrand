import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  createAdminProduct,
  listAdminProducts,
} from "@/server/admin/products-dal";
import { buildRateLimitKey, checkRateLimit } from "@/server/http/rate-limit";
import {
  apiConflict,
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
const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const nullableText = (max: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().max(max).nullable().optional(),
  );

const createProductSchema = z.object({
  slug: slugSchema,
  brandId: z.string().uuid(),
  categoryId: z.string().uuid(),
  title: z.string().trim().min(1).max(180),
  badge: nullableText(80),
  feature: nullableText(120),
  tagline: nullableText(300),
  description: nullableText(2000),
  rating: z.number().min(0).max(5).optional(),
  ratingCount: z.number().int().min(0).max(100000000).optional(),
  status: publishStatusSchema.default("draft"),
  seoTitle: nullableText(160),
  seoDescription: nullableText(320),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminActor("editor");

    const params = request.nextUrl.searchParams;
    const status = parseStatus(params.get("status"));
    const result = await listAdminProducts({
      page: params.get("page"),
      pageSize: params.get("pageSize"),
      q: params.get("q"),
      brandId: params.get("brandId"),
      categoryId: params.get("categoryId"),
      status,
    });

    return apiOk(result);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-products:get");
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-product-create"),
      limit: 60,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const actor = await requireAdminActor("editor");
    const body = await readJsonObject(request);
    const validation = validateBody(createProductSchema, body);

    if (!validation.ok) {
      return apiValidationError();
    }

    const input: TablesInsert<"products"> = {
      slug: validation.data.slug,
      brand_id: validation.data.brandId,
      category_id: validation.data.categoryId,
      title: validation.data.title,
      badge: validation.data.badge ?? null,
      feature: validation.data.feature ?? null,
      tagline: validation.data.tagline ?? null,
      description: validation.data.description ?? null,
      rating: validation.data.rating ?? 0,
      rating_count: validation.data.ratingCount ?? 0,
      status: validation.data.status,
      seo_title: validation.data.seoTitle ?? null,
      seo_description: validation.data.seoDescription ?? null,
    };

    const created = await createAdminProduct(input);
    await writeAuditLog({
      actor,
      action: "product.created",
      entityTable: "products",
      entityId: created.id,
      after: created,
      request,
    });
    revalidateProductTags(created.slug);

    return apiOk(created, { status: 201 });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    if (isUniqueConflict(error)) {
      return apiConflict("A product with that slug already exists.");
    }
    if (isForeignKeyConflict(error)) {
      return apiConflict("Choose an existing brand and category.");
    }
    return apiInternalError(error, "admin-products:post");
  }
}

function parseStatus(value: string | null): PublishStatus | null {
  const result = publishStatusSchema.safeParse(value);
  return result.success ? result.data : null;
}

function revalidateProductTags(slug: string) {
  revalidateTag("products", { expire: 0 });
  revalidateTag("home-page", { expire: 0 });
  revalidateTag(`product:${slug}`, { expire: 0 });
}

function isUniqueConflict(error: unknown) {
  const code = (error as { code?: unknown } | null)?.code;
  return code === "23505";
}

function isForeignKeyConflict(error: unknown) {
  const code = (error as { code?: unknown } | null)?.code;
  return code === "23503";
}
