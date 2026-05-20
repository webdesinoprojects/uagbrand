import "server-only";

import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { CustomerProfileData } from "@/types/api";
import type { Tables, TablesUpdate } from "@/types/supabase";

type ProfileRow = Pick<
  Tables<"profiles">,
  | "id"
  | "email"
  | "full_name"
  | "phone"
  | "is_active"
  | "created_at"
  | "updated_at"
>;

export type UpdateCustomerProfileInput = {
  fullName?: string | null;
  phone?: string | null;
};

export async function getCustomerProfile(userId: string) {
  const profile = await getProfileRow(userId);
  return profile ? mapProfileRow(profile) : null;
}

export async function updateCustomerProfile(
  userId: string,
  input: UpdateCustomerProfileInput,
) {
  const admin = createSupabaseAdminClient();
  const update: TablesUpdate<"profiles"> = {};

  if (input.fullName !== undefined) {
    update.full_name = input.fullName;
  }

  if (input.phone !== undefined) {
    update.phone = input.phone;
  }

  const result = await admin
    .from("profiles")
    .update(update)
    .eq("id", userId)
    .eq("is_active", true)
    .select("id,email,full_name,phone,is_active,created_at,updated_at")
    .maybeSingle<ProfileRow>();

  if (result.error) {
    throw result.error;
  }

  return result.data ? mapProfileRow(result.data) : null;
}

async function getProfileRow(userId: string) {
  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("profiles")
    .select("id,email,full_name,phone,is_active,created_at,updated_at")
    .eq("id", userId)
    .eq("is_active", true)
    .maybeSingle<ProfileRow>();

  if (result.error) {
    throw result.error;
  }

  return result.data;
}

function mapProfileRow(row: ProfileRow): CustomerProfileData {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
