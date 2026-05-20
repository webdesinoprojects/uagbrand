import { z } from "zod";

import { buildRateLimitKey, checkRateLimit } from "@/server/http/rate-limit";
import {
  apiForbidden,
  apiInternalError,
  apiOk,
  apiRateLimited,
  apiUnauthorized,
  apiValidationError,
} from "@/server/http/response";
import { readJsonObject, validateBody } from "@/server/http/validation";
import { createSupabaseServerClient } from "@/server/supabase/server";
import {
  getCurrentAdminActor,
  isEditorRole,
  isStaffRole,
  isSupportRole,
  type AdminActor,
} from "@/server/supabase/auth";
import type { AdminSessionData } from "@/types/api";
import type { AdminSessionRole } from "@/types/api";

const adminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});

type ProfileRow = {
  id: string;
  email: string;
  role: AdminActor["role"];
  is_active: boolean;
};

export async function GET() {
  try {
    const actor = await getCurrentAdminActor();

    if (!actor || !actor.isActive || !isStaffRole(actor.role)) {
      return apiOk(buildSessionData(null));
    }

    return apiOk(buildSessionData(actor));
  } catch (error) {
    return apiInternalError(error, "admin-session:get");
  }
}

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-session-login"),
      limit: 5,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const body = await readJsonObject(request);
    const validation = validateBody(adminLoginSchema, body);

    if (!validation.ok) {
      return apiValidationError();
    }

    const supabase = await createSupabaseServerClient();
    const loginResult = await supabase.auth.signInWithPassword(validation.data);

    if (loginResult.error || !loginResult.data.user) {
      return apiUnauthorized("Please check your login details.");
    }

    const profileResult = await supabase
      .from("profiles")
      .select("id,email,role,is_active")
      .eq("id", loginResult.data.user.id)
      .maybeSingle<ProfileRow>();

    if (
      profileResult.error ||
      !profileResult.data ||
      !profileResult.data.is_active ||
      !isStaffRole(profileResult.data.role)
    ) {
      await supabase.auth.signOut();
      return apiForbidden();
    }

    return apiOk(
      buildSessionData({
        id: profileResult.data.id,
        email: profileResult.data.email,
        role: profileResult.data.role,
        isActive: profileResult.data.is_active,
      }),
    );
  } catch (error) {
    return apiInternalError(error, "admin-session:post");
  }
}

export async function DELETE() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();

    return apiOk(buildSessionData(null));
  } catch (error) {
    return apiInternalError(error, "admin-session:delete");
  }
}

function buildSessionData(actor: AdminActor | null): AdminSessionData {
  if (!actor) {
    return {
      authenticated: false,
      actor: null,
      permissions: {
        canAccessAdmin: false,
        canManageCatalog: false,
        canManageOrders: false,
        canManageUsers: false,
      },
    };
  }

  return {
    authenticated: true,
    actor: {
      id: actor.id,
      email: actor.email,
      role: actor.role as AdminSessionRole,
    },
    permissions: {
      canAccessAdmin: isStaffRole(actor.role),
      canManageCatalog: isEditorRole(actor.role),
      canManageOrders: isSupportRole(actor.role),
      canManageUsers: actor.role === "admin",
    },
  };
}
