import "server-only";

import { createSupabaseAdminClient } from "@/server/supabase/admin";
import type { AdminActor } from "@/server/supabase/auth";
import type { Json } from "@/types/supabase";

type AuditLogInput = {
  actor: AdminActor | null;
  action: string;
  entityTable?: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  request?: Request;
};

export async function writeAuditLog({
  actor,
  action,
  entityTable,
  entityId,
  before,
  after,
  request,
}: AuditLogInput) {
  try {
    const supabase = createSupabaseAdminClient();
    const result = await supabase.from("audit_logs").insert({
      actor_id: actor?.id ?? null,
      action,
      entity_table: entityTable ?? null,
      entity_id: entityId ?? null,
      before: toAuditJson(before),
      after: toAuditJson(after),
      ip_address: getAuditIp(request),
      user_agent: request?.headers.get("user-agent") ?? null,
    });

    if (result.error) {
      console.error("[admin:audit]", result.error);
    }
  } catch (error) {
    console.error("[admin:audit]", error);
  }
}

function toAuditJson(value: unknown): Json | null {
  if (value === undefined) {
    return null;
  }

  return JSON.parse(JSON.stringify(value)) as Json;
}

function getAuditIp(request: Request | undefined) {
  if (!request) {
    return null;
  }

  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}
