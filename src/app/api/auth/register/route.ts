import { z } from "zod";

import {
  buildCustomerSession,
  ensureCustomerProfile,
} from "@/server/auth/customer-session";
import { mergeCurrentGuestCartIntoUserCart } from "@/server/cart/cart-dal";
import { buildRateLimitKey, checkRateLimit } from "@/server/http/rate-limit";
import {
  apiForbidden,
  apiConflict,
  apiInternalError,
  apiOk,
  apiRateLimited,
  apiValidationError,
} from "@/server/http/response";
import { readJsonObject, validateBody } from "@/server/http/validation";
import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { optionalIndianMobileSchema } from "@/server/commerce/india-validation";

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().trim().min(2).max(120),
  phone: optionalIndianMobileSchema,
});

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "customer-auth-register"),
      limit: 5,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const body = await readJsonObject(request);
    const validation = validateBody(registerSchema, body);
    if (!validation.ok) {
      return apiValidationError();
    }

    const admin = createSupabaseAdminClient();
    const createResult = await admin.auth.admin.createUser({
      email: validation.data.email,
      password: validation.data.password,
      email_confirm: true,
      user_metadata: {
        full_name: validation.data.fullName,
        phone: validation.data.phone ?? null,
      },
    });

    if (createResult.error || !createResult.data.user) {
      if (createResult.error?.status === 422) {
        return apiConflict("Please sign in or use another email address.");
      }

      if (createResult.error?.status === 429) {
        return apiRateLimited();
      }

      return apiValidationError("Please check your registration details.");
    }

    try {
      const profile = await ensureCustomerProfile({
        id: createResult.data.user.id,
        email: createResult.data.user.email ?? validation.data.email,
        fullName: validation.data.fullName,
        phone: validation.data.phone ?? null,
      });

      const supabase = await createSupabaseServerClient();
      const loginResult = await supabase.auth.signInWithPassword({
        email: validation.data.email,
        password: validation.data.password,
      });

      if (loginResult.error || !loginResult.data.user) {
        await admin.auth.admin.deleteUser(createResult.data.user.id);
        return apiValidationError("Please check your registration details.");
      }

      if (!profile.is_active) {
        await supabase.auth.signOut();
        return apiForbidden("This account cannot sign in right now.");
      }

      await mergeCurrentGuestCartIntoUserCart(createResult.data.user.id);

      return apiOk(buildCustomerSession(profile), { status: 201 });
    } catch (error) {
      await admin.auth.admin.deleteUser(createResult.data.user.id).catch(() => null);
      throw error;
    }
  } catch (error) {
    return apiInternalError(error, "customer-auth:register");
  }
}
