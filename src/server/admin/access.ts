import "server-only";

import {
  getCurrentAdminActor,
  isAdminRole,
  isEditorRole,
  isStaffRole,
  isSupportRole,
  type AdminActor,
  type AdminRole,
} from "@/server/supabase/auth";

export type AdminPermission = "admin" | "editor" | "support" | "staff";

export class AdminAccessError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403,
  ) {
    super(message);
    this.name = "AdminAccessError";
  }
}

export async function requireAdminActor(
  permission: AdminPermission = "admin",
): Promise<AdminActor> {
  const actor = await getCurrentAdminActor();

  if (!actor) {
    throw new AdminAccessError("Authentication required", 401);
  }

  if (!actor.isActive || !hasPermission(actor.role, permission)) {
    throw new AdminAccessError("Access denied", 403);
  }

  return actor;
}

export function hasPermission(role: AdminRole, permission: AdminPermission) {
  if (permission === "admin") {
    return isAdminRole(role);
  }

  if (permission === "editor") {
    return isEditorRole(role);
  }

  if (permission === "support") {
    return isSupportRole(role);
  }

  // "staff" — any of admin, editor, or support.
  return isStaffRole(role);
}
