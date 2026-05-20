import { z } from "zod";

import {
  deleteWishlistItem,
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
} from "@/server/http/response";

const idParamSchema = z.string().uuid();

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "wishlist-delete"),
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

    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that wishlist item.");
    }

    return apiOk(await deleteWishlistItem(session.user.id, id));
  } catch (error) {
    if (error instanceof WishlistOperationError) {
      if (error.kind === "not_found") {
        return apiNotFound(error.message);
      }

      return apiConflict(error.message);
    }

    return apiInternalError(error, "wishlist-detail:delete");
  }
}
