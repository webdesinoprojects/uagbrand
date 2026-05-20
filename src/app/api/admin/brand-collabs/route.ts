import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  createAdminBrandCollab,
  listAdminBrandCollabs,
} from "@/server/admin/brand-collabs-dal";
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
  title: z.string().trim().min(1).max(200),
  subtitle: nullableText(300),
  brandId: z.string().uuid().nullable().optional(),
  mediaId: z.string().uuid().nullable().optional(),
  status: publishStatusSchema.default("draft"),
  sortOrder: z.number().int().min(0).max(100_000).default(0),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminActor("editor");
    const p = request.nextUrl.searchParams;
    const result = await listAdminBrandCollabs({
      page: p.get("page"),
      pageSize: p.get("pageSize"),
      q: p.get("q"),
      status: parseStatus(p.get("status")),
      brandId: p.get("brandId"),
    });
    return apiOk(result);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-brand-collabs:get");
  }
}

export async function POST(request: NextRequest) {
  try {
    const rl = checkRateLimit({
      key: buildRateLimitKey(request, "admin-brand-collab-create"),
      limit: 60,
      windowMs: 60_000,
    });
    if (!rl.allowed) return apiRateLimited();
    const actor = await requireAdminActor("editor");
    const body = await readJsonObject(request);
    const v = validateBody(createSchema, body);
    if (!v.ok) return apiValidationError();

    const input: TablesInsert<"brand_collabs"> = {
      title: v.data.title,
      subtitle: v.data.subtitle ?? null,
      brand_id: v.data.brandId ?? null,
      media_id: v.data.mediaId ?? null,
      status: v.data.status,
      sort_order: v.data.sortOrder,
    };
    const created = await createAdminBrandCollab(input);
    await writeAuditLog({
      actor,
      action: "brand_collab.created",
      entityTable: "brand_collabs",
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
    return apiInternalError(error, "admin-brand-collabs:post");
  }
}

function parseStatus(v: string | null): PublishStatus | null {
  const r = publishStatusSchema.safeParse(v);
  return r.success ? r.data : null;
}
