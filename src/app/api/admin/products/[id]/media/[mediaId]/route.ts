import { revalidateTag } from "next/cache";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  deleteAdminProductMedia,
  getAdminProductById,
  getAdminProductMediaById,
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
} from "@/server/http/response";

const idParamSchema = z.string().uuid();

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; mediaId: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-product-media-delete"),
      limit: 30,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const actor = await requireAdminActor("editor");
    const { id: productId, mediaId } = await context.params;

    if (
      !idParamSchema.safeParse(productId).success ||
      !idParamSchema.safeParse(mediaId).success
    ) {
      return apiNotFound("We could not find that product media item.");
    }

    const product = await getAdminProductById(productId);
    if (!product) {
      return apiNotFound("We could not find that product.");
    }

    const before = await getAdminProductMediaById(productId, mediaId);
    if (!before) {
      return apiNotFound("We could not find that product media item.");
    }

    const deleted = await deleteAdminProductMedia(productId, mediaId);
    if (!deleted) {
      return apiNotFound("We could not find that product media item.");
    }

    await writeAuditLog({
      actor,
      action: "product_media.deleted",
      entityTable: "product_media",
      entityId: mediaId,
      before,
      request,
    });
    revalidateProductTags(product.slug);

    return apiOk({ id: mediaId, deleted: true });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    if (isForeignKeyConflict(error)) {
      return apiConflict("This product media item is linked to another record.");
    }
    return apiInternalError(error, "admin-product-media-detail:delete");
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
