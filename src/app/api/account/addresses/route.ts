import {
  createCustomerAddress,
  listCustomerAddresses,
} from "@/server/account/addresses-dal";
import { createAddressSchema } from "@/server/account/address-validation";
import { getCurrentCustomerSession } from "@/server/auth/customer-session";
import { buildRateLimitKey, checkRateLimit } from "@/server/http/rate-limit";
import {
  apiInternalError,
  apiOk,
  apiRateLimited,
  apiUnauthorized,
  apiValidationError,
} from "@/server/http/response";
import { readJsonObject, validateBody } from "@/server/http/validation";

export async function GET() {
  try {
    const session = await getCurrentCustomerSession();
    if (!session.user) {
      return apiUnauthorized();
    }

    return apiOk(await listCustomerAddresses(session.user.id));
  } catch (error) {
    return apiInternalError(error, "account-addresses:get");
  }
}

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "account-address-create"),
      limit: 20,
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
    const validation = validateBody(createAddressSchema, body);
    if (!validation.ok) {
      return apiValidationError();
    }

    return apiOk(await createCustomerAddress(session.user.id, validation.data), {
      status: 201,
    });
  } catch (error) {
    return apiInternalError(error, "account-addresses:post");
  }
}
