import { z } from "zod";

import {
  buildCustomerSession,
  ensureCustomerProfile,
  getProfileForCurrentUser,
} from "@/server/auth/customer-session";
import { mergeCurrentGuestCartIntoUserCart } from "@/server/cart/cart-dal";
import { buildRateLimitKey, checkRateLimit } from "@/server/http/rate-limit";
import {
  apiForbidden,
  apiInternalError,
  apiOk,
  apiRateLimited,
  apiUnauthorized,
  apiValidationError,
} from "@/server/http/response";
import { readJsonObject, validateBody } from "@/server/http/validation";
import { createSupabaseServerClient } from "@/server/supabase/server";
import {
  isValidIndianMobile,
  normalizeIndianMobile,
} from "@/server/commerce/india-validation";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "customer-auth-login"),
      limit: 5,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const body = await readJsonObject(request);
    const validation = validateBody(loginSchema, body);
    if (!validation.ok) {
      return apiValidationError();
    }

    const supabase = await createSupabaseServerClient();
    const loginResult = await supabase.auth.signInWithPassword(validation.data);

    if (loginResult.error || !loginResult.data.user) {
      return apiUnauthorized("Please check your login details.");
    }

    const user = loginResult.data.user;
    let profile = await getProfileForCurrentUser(user.id);

    if (!profile) {
      profile = await ensureCustomerProfile({
        id: user.id,
        email: user.email ?? validation.data.email,
        fullName: normalizeMetadataString(user.user_metadata.full_name),
        phone: normalizeMetadataPhone(user.user_metadata.phone),
      });
    }

    if (!profile.is_active) {
      await supabase.auth.signOut();
      return apiForbidden("This account cannot sign in right now.");
    }

    await mergeCurrentGuestCartIntoUserCart(user.id);

    return apiOk(buildCustomerSession(profile));
  } catch (error) {
    return apiInternalError(error, "customer-auth:login");
  }
}

function normalizeMetadataString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeMetadataPhone(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  return isValidIndianMobile(value) ? normalizeIndianMobile(value) : null;
}
