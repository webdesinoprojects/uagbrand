import { getCurrentCustomerSession } from "@/server/auth/customer-session";
import {
  getCustomerProfile,
  updateCustomerProfile,
} from "@/server/account/profile-dal";
import { updateProfileSchema } from "@/server/account/profile-validation";
import { buildRateLimitKey, checkRateLimit } from "@/server/http/rate-limit";
import {
  apiInternalError,
  apiNotFound,
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

    const profile = await getCustomerProfile(session.user.id);
    if (!profile) {
      return apiNotFound("We could not find your profile.");
    }

    return apiOk(profile);
  } catch (error) {
    return apiInternalError(error, "account-profile:get");
  }
}

export async function PATCH(request: Request) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "account-profile-update"),
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
    const validation = validateBody(updateProfileSchema, body);
    if (!validation.ok) {
      return apiValidationError();
    }

    const profile = await updateCustomerProfile(session.user.id, validation.data);
    if (!profile) {
      return apiNotFound("We could not find your profile.");
    }

    return apiOk(profile);
  } catch (error) {
    return apiInternalError(error, "account-profile:patch");
  }
}
