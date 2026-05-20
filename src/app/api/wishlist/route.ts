import { z } from "zod";

import {
  addWishlistItem,
  listWishlist,
  WishlistOperationError,
} from "@/server/account/wishlist-dal";
import { getCurrentCustomerSession } from "@/server/auth/customer-session";
import { buildRateLimitKey, checkRateLimit } from "@/server/http/rate-limit";
import {
  apiConflict,
  apiInternalError,
  apiNotFound,
  apiOk,
  apiRateLimited,
  apiUnauthorized,
  apiValidationError,
} from "@/server/http/response";
import { readJsonObject, validateBody } from "@/server/http/validation";

const addWishlistSchema = z.object({
  productId: z.string().uuid(),
});

export async function GET() {
  try {
    const session = await getCurrentCustomerSession();
    if (!session.user) {
      return apiUnauthorized();
    }

    return apiOk(await listWishlist(session.user.id));
  } catch (error) {
    return apiInternalError(error, "wishlist:get");
  }
}

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "wishlist-add"),
      limit: 60,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const session = await getCurrentCustomerSession();
    if (!session.user) {
      return apiUnauthorized();
    }

    const body = await readJsonObject(request);
    const validation = validateBody(addWishlistSchema, body);
    if (!validation.ok) {
      return apiValidationError();
    }

    return apiOk(await addWishlistItem(session.user.id, validation.data.productId), {
      status: 201,
    });
  } catch (error) {
    if (error instanceof WishlistOperationError) {
      if (error.kind === "not_found") {
        return apiNotFound(error.message);
      }

      return apiConflict(error.message);
    }

    return apiInternalError(error, "wishlist:post");
  }
}
