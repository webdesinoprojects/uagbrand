import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { hasSupabasePublicEnv, requirePublicEnv } from "@/server/env";

export async function createSupabaseServerClient() {
  if (!hasSupabasePublicEnv()) {
    throw new Error("Supabase public environment is not configured.");
  }

  const cookieStore = await cookies();

  return createServerClient(
    requirePublicEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requirePublicEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot write cookies. Route handlers and
            // server actions can; auth proxy wiring will handle refresh later.
          }
        },
      },
    },
  );
}
