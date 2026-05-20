import { buildRateLimitKey, checkRateLimit } from "@/server/http/rate-limit";
import {
  apiInternalError,
  apiOk,
  apiRateLimited,
} from "@/server/http/response";
import {
  clearCartForRequest,
  getCartForRequest,
} from "@/server/cart/cart-dal";

export async function GET() {
  try {
    return apiOk(await getCartForRequest());
  } catch (error) {
    return apiInternalError(error, "cart:get");
  }
}

export async function DELETE(request: Request) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "cart-clear"),
      limit: 30,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    return apiOk(await clearCartForRequest());
  } catch (error) {
    return apiInternalError(error, "cart:delete");
  }
}
