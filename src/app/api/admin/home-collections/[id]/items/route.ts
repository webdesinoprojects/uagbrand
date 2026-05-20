import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  asJsonObject,
  createAdminCollectionItem,
  getAdminHomeCollectionById,
  listAdminCollectionItems,
} from "@/server/admin/home-collections-dal";
import { buildRateLimitKey, checkRateLimit } from "@/server/http/rate-limit";
import {
  apiForbidden,
  apiInternalError,
  apiNotFound,
  apiOk,
  apiRateLimited,
  apiUnauthorized,
  apiValidationError,
} from "@/server/http/response";
import { readJsonObject, validateBody } from "@/server/http/validation";
import type { PublishStatus } from "@/types/api";
import type { TablesInsert } from "@/types/supabase";

const publishStatusSchema = z.enum(["draft", "published", "archived"]);
const idParamSchema = z.string().uuid();
const nullableText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(max).nullable().optional(),
  );

const createSchema = z.object({
  productId: z.string().uuid().nullable().optional(),
  title: nullableText(200),
  badge: nullableText(80),
  feature: nullableText(160),
  href: nullableText(500),
  mediaId: z.string().uuid().nullable().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  status: publishStatusSchema.default("draft"),
  sortOrder: z.number().int().min(0).max(100_000).default(0),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminActor("editor");
    const { id: collectionId } = await context.params;
    if (!idParamSchema.safeParse(collectionId).success) {
      return apiNotFound("We could not find that home collection.");
    }
    const parent = await getAdminHomeCollectionById(collectionId);
    if (!parent) return apiNotFound("We could not find that home collection.");

    const p = request.nextUrl.searchParams;
    const result = await listAdminCollectionItems(collectionId, {
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
    return apiInternalError(error, "admin-collection-items:get");
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rl = checkRateLimit({
      key: buildRateLimitKey(request, "admin-collection-item-create"),
      limit: 60,
      windowMs: 60_000,
    });
    if (!rl.allowed) return apiRateLimited();
    const actor = await requireAdminActor("editor");

    const { id: collectionId } = await context.params;
    if (!idParamSchema.safeParse(collectionId).success) {
      return apiNotFound("We could not find that home collection.");
    }
    const parent = await getAdminHomeCollectionById(collectionId);
    if (!parent) return apiNotFound("We could not find that home collection.");

    const body = await readJsonObject(request);
    const v = validateBody(createSchema, body);
    if (!v.ok) return apiValidationError();

    const input: TablesInsert<"collection_items"> = {
      collection_id: collectionId,
      product_id: v.data.productId ?? null,
      title: v.data.title ?? null,
      badge: v.data.badge ?? null,
      feature: v.data.feature ?? null,
      href: v.data.href ?? null,
      media_id: v.data.mediaId ?? null,
      payload: asJsonObject(v.data.payload),
      status: v.data.status,
      sort_order: v.data.sortOrder,
    };
    const created = await createAdminCollectionItem(input);
    await writeAuditLog({
      actor,
      action: "collection_item.created",
      entityTable: "collection_items",
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
    return apiInternalError(error, "admin-collection-items:post");
  }
}

function parseStatus(v: string | null): PublishStatus | null {
  const r = publishStatusSchema.safeParse(v);
  return r.success ? r.data : null;
}
