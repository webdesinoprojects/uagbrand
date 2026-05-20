import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  createAdminTrustCard,
  listAdminTrustCards,
} from "@/server/admin/trust-cards-dal";
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
import type { PublishStatus } from "@/types/api";
import type { TablesInsert } from "@/types/supabase";

const publishStatusSchema = z.enum(["draft", "published", "archived"]);
const nullableText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(max).nullable().optional(),
  );

const createSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: nullableText(500),
  metric: nullableText(80),
  status: publishStatusSchema.default("draft"),
  sortOrder: z.number().int().min(0).max(100_000).default(0),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminActor("editor");
    const p = request.nextUrl.searchParams;
    const result = await listAdminTrustCards({
      page: p.get("page"),
      pageSize: p.get("pageSize"),
      q: p.get("q"),
      status: parseStatus(p.get("status")),
    });
    return apiOk(result);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-trust-cards:get");
  }
}

export async function POST(request: NextRequest) {
  try {
    const rl = checkRateLimit({
      key: buildRateLimitKey(request, "admin-trust-card-create"),
      limit: 60,
      windowMs: 60_000,
    });
    if (!rl.allowed) return apiRateLimited();
    const actor = await requireAdminActor("editor");
    const body = await readJsonObject(request);
    const v = validateBody(createSchema, body);
    if (!v.ok) return apiValidationError();

    const input: TablesInsert<"trust_cards"> = {
      title: v.data.title,
      description: v.data.description ?? null,
      metric: v.data.metric ?? null,
      status: v.data.status,
      sort_order: v.data.sortOrder,
    };
    const created = await createAdminTrustCard(input);
    await writeAuditLog({
      actor,
      action: "trust_card.created",
      entityTable: "trust_cards",
      entityId: created.id,
      after: created,
      request,
    });
    revalidateTag("home-page", { expire: 0 });
    return apiOk(created, { status: 201 });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-trust-cards:post");
  }
}

function parseStatus(v: string | null): PublishStatus | null {
  const r = publishStatusSchema.safeParse(v);
  return r.success ? r.data : null;
}
