import { revalidateTag } from "next/cache";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  getProductSlugById,
  unlinkAdminOfferFromProduct,
} from "@/server/admin/offers-dal";
import { buildRateLimitKey, checkRateLimit } from "@/server/http/rate-limit";
import {
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
  context: { params: Promise<{ id: string; offerId: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-product-offer-unlink"),
      limit: 30,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const actor = await requireAdminActor("editor");

    const { id: productId, offerId } = await context.params;
    if (
      !idParamSchema.safeParse(productId).success ||
      !idParamSchema.safeParse(offerId).success
    ) {
      return apiNotFound("We could not find that product offer link.");
    }

    const productSlug = await getProductSlugById(productId);
    if (!productSlug) {
      return apiNotFound("We could not find that product.");
    }

    const removed = await unlinkAdminOfferFromProduct(productId, offerId);
    if (!removed) {
      return apiNotFound("We could not find that product offer link.");
    }

    await writeAuditLog({
      actor,
      action: "product_offer_link.deleted",
      entityTable: "product_offer_links",
      entityId: offerId,
      before: { productId, offerId },
      request,
    });
    revalidateProductOfferTags(productSlug);

    return apiOk({ productId, offerId, unlinked: true });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-product-offer-unlink:delete");
  }
}

function revalidateProductOfferTags(productSlug: string) {
  revalidateTag("products", { expire: 0 });
  revalidateTag("home-page", { expire: 0 });
  revalidateTag(`product:${productSlug}`, { expire: 0 });
}
