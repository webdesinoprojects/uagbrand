import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  createAdminNavigationItem,
  listAdminNavigationItems,
} from "@/server/admin/navigation-dal";
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

const createNavSchema = z.object({
  location: z.string().trim().min(1).max(80),
  parentId: z.string().uuid().nullable().optional(),
  label: z.string().trim().min(1).max(120),
  href: z.string().trim().min(1).max(500),
  status: publishStatusSchema.default("draft"),
  sortOrder: z.number().int().min(0).max(100_000).default(0),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminActor("editor");

    const params = request.nextUrl.searchParams;
    const result = await listAdminNavigationItems({
      page: params.get("page"),
      pageSize: params.get("pageSize"),
      q: params.get("q"),
      status: parseStatus(params.get("status")),
      location: params.get("location"),
      parentId: params.get("parentId"),
    });

    return apiOk(result);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-navigation:get");
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-nav-create"),
      limit: 60,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) return apiRateLimited();

    const actor = await requireAdminActor("editor");
    const body = await readJsonObject(request);
    const validation = validateBody(createNavSchema, body);
    if (!validation.ok) return apiValidationError();

    const input: TablesInsert<"navigation_items"> = {
      location: validation.data.location,
      parent_id: validation.data.parentId ?? null,
      label: validation.data.label,
      href: validation.data.href,
      status: validation.data.status,
      sort_order: validation.data.sortOrder,
    };

    const created = await createAdminNavigationItem(input);
    await writeAuditLog({
      actor,
      action: "navigation_item.created",
      entityTable: "navigation_items",
      entityId: created.id,
      after: created,
      request,
    });
    revalidateTag("site-chrome", { expire: 0 });

    return apiOk(created, { status: 201 });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-navigation:post");
  }
}

function parseStatus(value: string | null): PublishStatus | null {
  const result = publishStatusSchema.safeParse(value);
  return result.success ? result.data : null;
}
