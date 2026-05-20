import { buildRateLimitKey, checkRateLimit } from "@/server/http/rate-limit";
import {
  apiInternalError,
  apiOk,
  apiRateLimited,
} from "@/server/http/response";
import { createSupabaseServerClient } from "@/server/supabase/server";

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "customer-auth-logout"),
      limit: 30,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    return apiOk({
      authenticated: false,
      user: null,
    });
  } catch (error) {
    return apiInternalError(error, "customer-auth:logout");
  }
}
