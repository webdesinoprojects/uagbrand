import "server-only";

import { createClient } from "@supabase/supabase-js";

import {
  hasSupabaseAdminEnv,
  requirePublicEnv,
  requireServerEnv,
} from "@/server/env";

export function createSupabaseAdminClient() {
  if (!hasSupabaseAdminEnv()) {
    throw new Error("Supabase admin environment is not configured.");
  }

  return createClient(
    requirePublicEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
