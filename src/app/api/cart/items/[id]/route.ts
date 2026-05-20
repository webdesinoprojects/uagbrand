import { z } from "zod";

import {
  CartOperationError,
  deleteCartItem,
  MAX_CART_ITEM_QUANTITY,
  updateCartItemQuantity,
} from "@/server/cart/cart-dal";
import { buildRateLimitKey, checkRateLimit } from "@/server/http/rate-limit";
import {
  apiConflict,
  apiInternalError,
  apiNotFound,
  apiOk,
  apiRateLimited,
  apiValidationError,
} from "@/server/http/response";
import { readJsonObject, validateBody } from "@/server/http/validation";

const idParamSchema = z.string().uuid();
const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(MAX_CART_ITEM_QUANTITY),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "cart-item-update"),
      limit: 60,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that cart item.");
    }

    const body = await readJsonObject(request);
    const validation = validateBody(updateCartItemSchema, body);
    if (!validation.ok) {
      return apiValidationError();
    }

    return apiOk(await updateCartItemQuantity(id, validation.data.quantity));
  } catch (error) {
    if (error instanceof CartOperationError) {
      if (error.kind === "not_found") {
        return apiNotFound(error.message);
      }

      return apiConflict(error.message);
    }

    return apiInternalError(error, "cart-item-detail:patch");
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "cart-item-delete"),
      limit: 60,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that cart item.");
    }

    return apiOk(await deleteCartItem(id));
  } catch (error) {
    if (error instanceof CartOperationError) {
      if (error.kind === "not_found") {
        return apiNotFound(error.message);
      }

      return apiConflict(error.message);
    }

    return apiInternalError(error, "cart-item-detail:delete");
  }
}
