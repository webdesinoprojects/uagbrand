import { revalidateTag } from "next/cache";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  createAdminProductMedia,
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
const createProductMediaSchema = z.object({
  mediaId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  role: z.string().trim().min(1).max(40).default("gallery"),
  sortOrder: z.number().int().min(0).max(100000).default(0),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-product-media-create"),
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
    const validation = validateBody(createProductMediaSchema, body);

    if (!validation.ok) {
      return apiValidationError();
    }

    const input: TablesInsert<"product_media"> = {
      product_id: productId,
      media_id: validation.data.mediaId,
      variant_id: validation.data.variantId ?? null,
      role: validation.data.role,
      sort_order: validation.data.sortOrder,
    };

    const created = await createAdminProductMedia(input);
    await writeAuditLog({
      actor,
      action: "product_media.created",
      entityTable: "product_media",
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
    if (isForeignKeyConflict(error)) {
      return apiConflict("Choose an existing product media asset and variant.");
    }
    return apiInternalError(error, "admin-product-media:post");
  }
}

function revalidateProductTags(slug: string) {
  revalidateTag("products", { expire: 0 });
  revalidateTag("home-page", { expire: 0 });
  revalidateTag(`product:${slug}`, { expire: 0 });
}

function isForeignKeyConflict(error: unknown) {
  const code = (error as { code?: unknown } | null)?.code;
  return code === "23503";
}
