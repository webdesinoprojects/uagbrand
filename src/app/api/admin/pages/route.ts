import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  createAdminPage,
  listAdminPages,
} from "@/server/admin/pages-dal";
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
const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const nullableText = (max: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().max(max).nullable().optional(),
  );

const createPageSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1).max(200),
  excerpt: nullableText(500),
  body: nullableText(50_000),
  status: publishStatusSchema.default("draft"),
  seoTitle: nullableText(160),
  seoDescription: nullableText(320),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminActor("editor");

    const params = request.nextUrl.searchParams;
    const result = await listAdminPages({
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
    return apiInternalError(error, "admin-pages:get");
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-page-create"),
      limit: 60,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) return apiRateLimited();

    const actor = await requireAdminActor("editor");
    const body = await readJsonObject(request);
    const validation = validateBody(createPageSchema, body);
    if (!validation.ok) return apiValidationError();

    const input: TablesInsert<"pages"> = {
      slug: validation.data.slug,
      title: validation.data.title,
      excerpt: validation.data.excerpt ?? null,
      body: validation.data.body ?? null,
      status: validation.data.status,
      seo_title: validation.data.seoTitle ?? null,
      seo_description: validation.data.seoDescription ?? null,
    };

    const created = await createAdminPage(input);
    await writeAuditLog({
      actor,
      action: "page.created",
      entityTable: "pages",
      entityId: created.id,
      after: created,
      request,
    });
    revalidatePageTags(created.slug);

    return apiOk(created, { status: 201 });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    if (isUniqueViolation(error)) {
      return apiConflict("A page with that slug already exists.");
    }
    return apiInternalError(error, "admin-pages:post");
  }
}

function parseStatus(value: string | null): PublishStatus | null {
  const result = publishStatusSchema.safeParse(value);
  return result.success ? result.data : null;
}

function isUniqueViolation(error: unknown) {
  return (error as { code?: unknown } | null)?.code === "23505";
}

function revalidatePageTags(slug: string) {
  revalidateTag(`page:${slug}`, { expire: 0 });
  revalidateTag("site-chrome", { expire: 0 });
}
