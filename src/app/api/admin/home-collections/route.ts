import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  createAdminHomeCollection,
  listAdminHomeCollections,
} from "@/server/admin/home-collections-dal";
import { buildRateLimitKey, checkRateLimit } from "@/server/http/rate-limit";
import {
  apiConflict,
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
const keySchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const nullableText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(max).nullable().optional(),
  );

const createSchema = z.object({
  key: keySchema,
  title: z.string().trim().min(1).max(200),
  description: nullableText(500),
  status: publishStatusSchema.default("draft"),
  sortOrder: z.number().int().min(0).max(100_000).default(0),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminActor("editor");
    const p = request.nextUrl.searchParams;
    const result = await listAdminHomeCollections({
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
    return apiInternalError(error, "admin-home-collections:get");
  }
}

export async function POST(request: NextRequest) {
  try {
    const rl = checkRateLimit({
      key: buildRateLimitKey(request, "admin-home-collection-create"),
      limit: 60,
      windowMs: 60_000,
    });
    if (!rl.allowed) return apiRateLimited();
    const actor = await requireAdminActor("editor");
    const body = await readJsonObject(request);
    const v = validateBody(createSchema, body);
    if (!v.ok) return apiValidationError();

    const input: TablesInsert<"home_collections"> = {
      key: v.data.key,
      title: v.data.title,
      description: v.data.description ?? null,
      status: v.data.status,
      sort_order: v.data.sortOrder,
    };
    const created = await createAdminHomeCollection(input);
    await writeAuditLog({
      actor,
      action: "home_collection.created",
      entityTable: "home_collections",
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
    if (isUniqueViolation(error)) {
      return apiConflict("A home collection with that key already exists.");
    }
    return apiInternalError(error, "admin-home-collections:post");
  }
}

function parseStatus(v: string | null): PublishStatus | null {
  const r = publishStatusSchema.safeParse(v);
  return r.success ? r.data : null;
}

function isUniqueViolation(error: unknown) {
  return (error as { code?: unknown } | null)?.code === "23505";
}
