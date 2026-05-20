import "server-only";

import { createClient } from "@supabase/supabase-js";

import { hasSupabasePublicEnv, requirePublicEnv } from "@/server/env";

export function createSupabasePublicClient() {
  if (!hasSupabasePublicEnv()) {
    throw new Error("Supabase public environment is not configured.");
  }

  return createClient(
    requirePublicEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requirePublicEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
