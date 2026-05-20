import "server-only";

import { createSupabaseAdminClient } from "@/server/supabase/admin";
import { createSupabaseServerClient } from "@/server/supabase/server";
import type {
  CustomerSessionData,
  CustomerSessionUser,
} from "@/types/api";
import type { Tables, TablesUpdate } from "@/types/supabase";

type ProfileRow = Pick<
  Tables<"profiles">,
  "id" | "email" | "full_name" | "phone" | "is_active"
>;

export type CustomerProfileInput = {
  id: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
};

export function buildCustomerSession(
  profile: ProfileRow | null,
): CustomerSessionData {
  if (!profile || !profile.is_active) {
    return {
      authenticated: false,
      user: null,
    };
  }

  return {
    authenticated: true,
    user: mapCustomerUser(profile),
  };
}

export async function getCurrentCustomerSession(): Promise<CustomerSessionData> {
  const supabase = await createSupabaseServerClient();
  const authResult = await supabase.auth.getUser();

  if (authResult.error || !authResult.data.user) {
    return buildCustomerSession(null);
  }

  const profile = await getProfileForCurrentUser(authResult.data.user.id);

  if (!profile?.is_active) {
    await supabase.auth.signOut();
    return buildCustomerSession(null);
  }

  return buildCustomerSession(profile);
}

export async function getProfileForCurrentUser(id: string) {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("profiles")
    .select("id,email,full_name,phone,is_active")
    .eq("id", id)
    .maybeSingle<ProfileRow>();

  if (result.error) {
    throw result.error;
  }

  return result.data;
}

export async function ensureCustomerProfile(input: CustomerProfileInput) {
  const admin = createSupabaseAdminClient();
  const existing = await admin
    .from("profiles")
    .select("id,email,full_name,phone,is_active")
    .eq("id", input.id)
    .maybeSingle<ProfileRow>();

  if (existing.error) {
    throw existing.error;
  }

  const updates: TablesUpdate<"profiles"> = {
    email: input.email,
  };

  if (input.fullName !== undefined) {
    updates.full_name = input.fullName;
  }

  if (input.phone !== undefined) {
    updates.phone = input.phone;
  }

  if (!existing.data) {
    const created = await admin
      .from("profiles")
      .insert({
        id: input.id,
        email: input.email,
        full_name: input.fullName ?? null,
        phone: input.phone ?? null,
        role: "customer",
        is_active: true,
      })
      .select("id,email,full_name,phone,is_active")
      .single<ProfileRow>();

    if (created.error) {
      throw created.error;
    }

    return created.data;
  }

  const updated = await admin
    .from("profiles")
    .update(updates)
    .eq("id", input.id)
    .select("id,email,full_name,phone,is_active")
    .single<ProfileRow>();

  if (updated.error) {
    throw updated.error;
  }

  return updated.data;
}

function mapCustomerUser(profile: ProfileRow): CustomerSessionUser {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    phone: profile.phone,
  };
}
