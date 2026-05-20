import { revalidateTag } from "next/cache";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  deleteAdminProduct,
  getAdminProductById,
  updateAdminProduct,
} from "@/server/admin/products-dal";
import { buildRateLimitKey, checkRateLimit } from "@/server/http/rate-limit";
import {
  apiConflict,
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

const updateProductSchema = z.object({
  slug: slugSchema.optional(),
  brandId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(180).optional(),
  badge: nullableText(80),
  feature: nullableText(120),
  tagline: nullableText(300),
  description: nullableText(2000),
  rating: z.number().min(0).max(5).optional(),
  ratingCount: z.number().int().min(0).max(100000000).optional(),
  status: publishStatusSchema.optional(),
  seoTitle: nullableText(160),
  seoDescription: nullableText(320),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminActor("editor");

    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that product.");
    }

    const product = await getAdminProductById(id);
    if (!product) {
      return apiNotFound("We could not find that product.");
    }

    return apiOk(product);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-product-detail:get");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-product-update"),
      limit: 60,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const actor = await requireAdminActor("editor");

    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that product.");
    }

    const body = await readJsonObject(request);
    const validation = validateBody(updateProductSchema, body);

    if (!validation.ok) {
      return apiValidationError();
    }

    const updates = toProductUpdate(validation.data);
    if (Object.keys(updates).length === 0) {
      return apiValidationError("Provide at least one field to update.");
    }

    const before = await getAdminProductById(id);
    if (!before) {
      return apiNotFound("We could not find that product.");
    }

    const after = await updateAdminProduct(id, updates);
    if (!after) {
      return apiNotFound("We could not find that product.");
    }

    await writeAuditLog({
      actor,
      action: "product.updated",
      entityTable: "products",
      entityId: id,
      before,
      after,
      request,
    });
    revalidateProductTags(before.slug);
    revalidateProductTags(after.slug);

    return apiOk(after);
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
    return apiInternalError(error, "admin-product-detail:patch");
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-product-delete"),
      limit: 30,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const actor = await requireAdminActor("editor");

    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that product.");
    }

    const before = await getAdminProductById(id);
    if (!before) {
      return apiNotFound("We could not find that product.");
    }

    const deleted = await deleteAdminProduct(id);
    if (!deleted) {
      return apiNotFound("We could not find that product.");
    }

    await writeAuditLog({
      actor,
      action: "product.deleted",
      entityTable: "products",
      entityId: id,
      before,
      request,
    });
    revalidateProductTags(before.slug);

    return apiOk({ id, deleted: true });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    if (isForeignKeyConflict(error)) {
      return apiConflict("This product is linked to orders. Archive it instead.");
    }
    return apiInternalError(error, "admin-product-detail:delete");
  }
}

function toProductUpdate(
  data: z.infer<typeof updateProductSchema>,
): TablesUpdate<"products"> {
  const updates: TablesUpdate<"products"> = {};

  if (data.slug !== undefined) updates.slug = data.slug;
  if (data.brandId !== undefined) updates.brand_id = data.brandId;
  if (data.categoryId !== undefined) updates.category_id = data.categoryId;
  if (data.title !== undefined) updates.title = data.title;
  if (data.badge !== undefined) updates.badge = data.badge;
  if (data.feature !== undefined) updates.feature = data.feature;
  if (data.tagline !== undefined) updates.tagline = data.tagline;
  if (data.description !== undefined) updates.description = data.description;
  if (data.rating !== undefined) updates.rating = data.rating;
  if (data.ratingCount !== undefined) updates.rating_count = data.ratingCount;
  if (data.status !== undefined) updates.status = data.status;
  if (data.seoTitle !== undefined) updates.seo_title = data.seoTitle;
  if (data.seoDescription !== undefined) {
    updates.seo_description = data.seoDescription;
  }

  return updates;
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
