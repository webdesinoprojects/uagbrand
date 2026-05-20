import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  createAdminFooterLink,
  getAdminFooterColumnById,
  listAdminFooterLinksForColumn,
} from "@/server/admin/footer-dal";
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

const createLinkSchema = z.object({
  label: z.string().trim().min(1).max(120),
  href: z.string().trim().min(1).max(500),
  status: publishStatusSchema.default("draft"),
  sortOrder: z.number().int().min(0).max(100_000).default(0),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminActor("editor");

    const { id: columnId } = await context.params;
    if (!idParamSchema.safeParse(columnId).success) {
      return apiNotFound("We could not find that footer column.");
    }

    const column = await getAdminFooterColumnById(columnId);
    if (!column) return apiNotFound("We could not find that footer column.");

    const params = request.nextUrl.searchParams;
    const result = await listAdminFooterLinksForColumn(columnId, {
      page: params.get("page"),
      pageSize: params.get("pageSize"),
      q: params.get("q"),
      status: parseStatus(params.get("status")),
    });

    return apiOk(result);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-footer-links:get");
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-footer-link-create"),
      limit: 60,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) return apiRateLimited();

    const actor = await requireAdminActor("editor");

    const { id: columnId } = await context.params;
    if (!idParamSchema.safeParse(columnId).success) {
      return apiNotFound("We could not find that footer column.");
    }

    const column = await getAdminFooterColumnById(columnId);
    if (!column) return apiNotFound("We could not find that footer column.");

    const body = await readJsonObject(request);
    const validation = validateBody(createLinkSchema, body);
    if (!validation.ok) return apiValidationError();

    const input: TablesInsert<"footer_links"> = {
      column_id: columnId,
      label: validation.data.label,
      href: validation.data.href,
      status: validation.data.status,
      sort_order: validation.data.sortOrder,
    };

    const created = await createAdminFooterLink(input);
    await writeAuditLog({
      actor,
      action: "footer_link.created",
      entityTable: "footer_links",
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
    return apiInternalError(error, "admin-footer-links:post");
  }
}

function parseStatus(value: string | null): PublishStatus | null {
  const result = publishStatusSchema.safeParse(value);
  return result.success ? result.data : null;
}
