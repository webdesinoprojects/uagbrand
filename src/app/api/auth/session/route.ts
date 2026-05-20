import {
  apiInternalError,
  apiOk,
} from "@/server/http/response";
import { getCurrentCustomerSession } from "@/server/auth/customer-session";
import { createSupabaseServerClient } from "@/server/supabase/server";

export async function GET() {
  try {
    return apiOk(await getCurrentCustomerSession());
  } catch (error) {
    return apiInternalError(error, "customer-session:get");
  }
}

export async function DELETE() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    return apiOk({
      authenticated: false,
      user: null,
    });
  } catch (error) {
    return apiInternalError(error, "customer-session:delete");
  }
}
