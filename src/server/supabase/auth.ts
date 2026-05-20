import "server-only";

import { createSupabaseServerClient } from "@/server/supabase/server";

export type AdminRole = "customer" | "support" | "editor" | "admin";

export type AdminActor = {
  id: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
};

type ProfileRow = {
  id: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
};

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const result = await supabase.auth.getUser();

  if (result.error || !result.data.user) {
    return null;
  }

  return result.data.user;
}

export async function getCurrentAdminActor(): Promise<AdminActor | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("profiles")
    .select("id,email,role,is_active")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (result.error || !result.data) {
    return null;
  }

  return {
    id: result.data.id,
    email: result.data.email,
    role: result.data.role,
    isActive: result.data.is_active,
  };
}

export function isAdminRole(role: AdminRole) {
  return role === "admin";
}

export function isEditorRole(role: AdminRole) {
  return role === "editor" || role === "admin";
}

export function isSupportRole(role: AdminRole) {
  return role === "support" || role === "admin";
}

export function isStaffRole(role: AdminRole) {
  return role === "support" || role === "editor" || role === "admin";
}
