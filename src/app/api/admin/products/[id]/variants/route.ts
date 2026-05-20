import { revalidateTag } from "next/cache";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  createAdminProductVariant,
  getAdminProductById,
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
import type { TablesInsert } from "@/types/supabase";

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

const createVariantSchema = z.object({
  sku: z.string().trim().min(1).max(120),
  colorName: nullableText(80),
  colorSwatch: colorSwatchSchema,
  isAvailable: z.boolean().default(true),
  priceAmount: z.number().int().min(0).max(100000000),
  compareAtAmount: z.number().int().min(0).max(100000000).nullable().optional(),
  currency: z.string().trim().toUpperCase().length(3).default("INR"),
  selectedByDefault: z.boolean().default(false),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-product-variant-create"),
      limit: 60,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const actor = await requireAdminActor("editor");
    const { id: productId } = await context.params;

    if (!idParamSchema.safeParse(productId).success) {
      return apiNotFound("We could not find that product.");
    }

    const product = await getAdminProductById(productId);
    if (!product) {
      return apiNotFound("We could not find that product.");
    }

    const body = await readJsonObject(request);
    const validation = validateBody(createVariantSchema, body);

    if (!validation.ok) {
      return apiValidationError();
    }

    const input: TablesInsert<"product_variants"> = {
      product_id: productId,
      sku: validation.data.sku,
      color_name: validation.data.colorName ?? null,
      color_swatch: validation.data.colorSwatch ?? null,
      is_available: validation.data.isAvailable,
      price_amount: validation.data.priceAmount,
      compare_at_amount: validation.data.compareAtAmount ?? null,
      currency: validation.data.currency,
      selected_by_default: validation.data.selectedByDefault,
    };

    const created = await createAdminProductVariant(input);
    await writeAuditLog({
      actor,
      action: "product_variant.created",
      entityTable: "product_variants",
      entityId: created.id,
      after: created,
      request,
    });
    revalidateProductTags(product.slug);

    return apiOk(created, { status: 201 });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    if (isUniqueConflict(error)) {
      return apiConflict("A variant with that SKU or default setting already exists.");
    }
    return apiInternalError(error, "admin-product-variants:post");
  }
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
