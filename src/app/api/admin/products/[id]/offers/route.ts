import { revalidateTag } from "next/cache";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  getAdminOfferById,
  getProductSlugById,
  linkAdminOfferToProduct,
} from "@/server/admin/offers-dal";
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

const idParamSchema = z.string().uuid();
const linkBodySchema = z.object({
  offerId: z.string().uuid(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-product-offer-link"),
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

    const body = await readJsonObject(request);
    const validation = validateBody(linkBodySchema, body);
    if (!validation.ok) {
      return apiValidationError();
    }

    const productSlug = await getProductSlugById(productId);
    if (!productSlug) {
      return apiNotFound("We could not find that product.");
    }

    const offer = await getAdminOfferById(validation.data.offerId);
    if (!offer) {
      return apiNotFound("We could not find that offer.");
    }

    try {
      await linkAdminOfferToProduct(productId, validation.data.offerId);
    } catch (linkError) {
      if (isUniqueViolation(linkError)) {
        return apiConflict("That offer is already linked to this product.");
      }
      throw linkError;
    }

    await writeAuditLog({
      actor,
      action: "product_offer_link.created",
      entityTable: "product_offer_links",
      entityId: validation.data.offerId,
      after: { productId, offerId: validation.data.offerId },
      request,
    });
    revalidateProductOfferTags(productSlug);

    return apiOk(
      { productId, offerId: validation.data.offerId, linked: true },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-product-offer-link:post");
  }
}

function isUniqueViolation(error: unknown) {
  const code = (error as { code?: unknown } | null)?.code;
  return code === "23505";
}

function revalidateProductOfferTags(productSlug: string) {
  revalidateTag("products", { expire: 0 });
  revalidateTag("home-page", { expire: 0 });
  revalidateTag(`product:${productSlug}`, { expire: 0 });
}
