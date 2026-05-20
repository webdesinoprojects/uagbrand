import { z } from "zod";

import {
  CheckoutOperationError,
  createCodCheckoutOrder,
} from "@/server/checkout/checkout-dal";
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

const checkoutSchema = z.object({
  shippingAddressId: z.string().uuid(),
  billingAddressId: z.string().uuid().nullable().optional(),
  paymentMethod: z.literal("cod").default("cod"),
});

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "checkout-create"),
      limit: 10,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const session = await getCurrentCustomerSession();
    if (!session.user) {
      return apiUnauthorized("Please sign in before checkout.");
    }

    const body = await readJsonObject(request);
    const validation = validateBody(checkoutSchema, body);
    if (!validation.ok) {
      return apiValidationError();
    }

    return apiOk(
      await createCodCheckoutOrder({
        userId: session.user.id,
        shippingAddressId: validation.data.shippingAddressId,
        billingAddressId: validation.data.billingAddressId ?? null,
      }),
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof CheckoutOperationError) {
      if (error.kind === "not_found") {
        return apiNotFound(error.message);
      }

      return apiConflict(error.message);
    }

    return apiInternalError(error, "checkout:post");
  }
}
