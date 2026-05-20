import { revalidateTag } from "next/cache";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  deleteAdminProductVariant,
  getAdminProductById,
  getAdminProductVariantById,
  updateAdminProductVariant,
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
const colorSwatchSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .nullable()
  .optional();
const nullableText = (max: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().max(max).nullable().optional(),
  );

const updateVariantSchema = z.object({
  sku: z.string().trim().min(1).max(120).optional(),
  colorName: nullableText(80),
  colorSwatch: colorSwatchSchema,
  isAvailable: z.boolean().optional(),
  priceAmount: z.number().int().min(0).max(100000000).optional(),
  compareAtAmount: z.number().int().min(0).max(100000000).nullable().optional(),
  currency: z.string().trim().toUpperCase().length(3).optional(),
  selectedByDefault: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; variantId: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-product-variant-update"),
      limit: 60,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const actor = await requireAdminActor("editor");
    const { id: productId, variantId } = await context.params;
    const refs = await validateProductAndVariant(productId, variantId);

    if ("response" in refs) {
      return refs.response;
    }

    const body = await readJsonObject(request);
    const validation = validateBody(updateVariantSchema, body);

    if (!validation.ok) {
      return apiValidationError();
    }

    const updates = toVariantUpdate(validation.data);
    if (Object.keys(updates).length === 0) {
      return apiValidationError("Provide at least one field to update.");
    }

    const after = await updateAdminProductVariant(productId, variantId, updates);
    if (!after) {
      return apiNotFound("We could not find that variant.");
    }

    await writeAuditLog({
      actor,
      action: "product_variant.updated",
      entityTable: "product_variants",
      entityId: variantId,
      before: refs.variant,
      after,
      request,
    });
    revalidateProductTags(refs.product.slug);

    return apiOk(after);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    if (isUniqueConflict(error)) {
      return apiConflict("A variant with that SKU or default setting already exists.");
    }
    if (isForeignKeyConflict(error)) {
      return apiConflict("This variant is linked to another record.");
    }
    return apiInternalError(error, "admin-product-variant-detail:patch");
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; variantId: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-product-variant-delete"),
      limit: 30,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const actor = await requireAdminActor("editor");
    const { id: productId, variantId } = await context.params;
    const refs = await validateProductAndVariant(productId, variantId);

    if ("response" in refs) {
      return refs.response;
    }

    const deleted = await deleteAdminProductVariant(productId, variantId);
    if (!deleted) {
      return apiNotFound("We could not find that variant.");
    }

    await writeAuditLog({
      actor,
      action: "product_variant.deleted",
      entityTable: "product_variants",
      entityId: variantId,
      before: refs.variant,
      request,
    });
    revalidateProductTags(refs.product.slug);

    return apiOk({ id: variantId, deleted: true });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    if (isForeignKeyConflict(error)) {
      return apiConflict("This variant is linked to orders. Mark it unavailable instead.");
    }
    return apiInternalError(error, "admin-product-variant-detail:delete");
  }
}

async function validateProductAndVariant(productId: string, variantId: string) {
  if (
    !idParamSchema.safeParse(productId).success ||
    !idParamSchema.safeParse(variantId).success
  ) {
    return { response: apiNotFound("We could not find that variant.") };
  }

  const product = await getAdminProductById(productId);
  if (!product) {
    return { response: apiNotFound("We could not find that product.") };
  }

  const variant = await getAdminProductVariantById(productId, variantId);
  if (!variant) {
    return { response: apiNotFound("We could not find that variant.") };
  }

  return { product, variant };
}

function toVariantUpdate(
  data: z.infer<typeof updateVariantSchema>,
): TablesUpdate<"product_variants"> {
  const updates: TablesUpdate<"product_variants"> = {};

  if (data.sku !== undefined) updates.sku = data.sku;
  if (data.colorName !== undefined) updates.color_name = data.colorName;
  if (data.colorSwatch !== undefined) updates.color_swatch = data.colorSwatch;
  if (data.isAvailable !== undefined) updates.is_available = data.isAvailable;
  if (data.priceAmount !== undefined) updates.price_amount = data.priceAmount;
  if (data.compareAtAmount !== undefined) {
    updates.compare_at_amount = data.compareAtAmount;
  }
  if (data.currency !== undefined) updates.currency = data.currency;
  if (data.selectedByDefault !== undefined) {
    updates.selected_by_default = data.selectedByDefault;
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
