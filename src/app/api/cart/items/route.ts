import { z } from "zod";

import {
  addCartItem,
  CartOperationError,
  MAX_CART_ITEM_QUANTITY,
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

const personalizationValueSchema = z.union([
  z.string().trim().max(200),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

const addCartItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullish(),
  quantity: z.number().int().min(1).max(MAX_CART_ITEM_QUANTITY).default(1),
  personalization: z
    .record(z.string().trim().min(1).max(80), personalizationValueSchema)
    .optional()
    .default({}),
});

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "cart-item-add"),
      limit: 60,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const body = await readJsonObject(request);
    const validation = validateBody(addCartItemSchema, body);
    if (!validation.ok) {
      return apiValidationError();
    }

    const cart = await addCartItem(validation.data);
    return apiOk(cart, { status: 201 });
  } catch (error) {
    if (error instanceof CartOperationError) {
      if (error.kind === "not_found") {
        return apiNotFound(error.message);
      }

      return apiConflict(error.message);
    }

    return apiInternalError(error, "cart-items:post");
  }
}
