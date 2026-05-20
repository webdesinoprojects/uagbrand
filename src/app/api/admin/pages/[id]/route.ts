import { revalidateTag } from "next/cache";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  deleteAdminPage,
  getAdminPageById,
  updateAdminPage,
} from "@/server/admin/pages-dal";
import { buildRateLimitKey, checkRateLimit } from "@/server/http/rate-limit";
import {
  apiConflict,
  apiForbidden,
  apiInternalError,
  apiNotFound,
  apiOk,
  apiRateLimited,
  apiUnauthorized,
  apiValidationError,
} from "@/server/http/response";
import { readJsonObject, validateBody } from "@/server/http/validation";
import type { TablesUpdate } from "@/types/supabase";

const publishStatusSchema = z.enum(["draft", "published", "archived"]);
const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const idParamSchema = z.string().uuid();
const nullableText = (max: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().max(max).nullable().optional(),
  );

const updatePageSchema = z.object({
  slug: slugSchema.optional(),
  title: z.string().trim().min(1).max(200).optional(),
  excerpt: nullableText(500),
  body: nullableText(50_000),
  status: publishStatusSchema.optional(),
  seoTitle: nullableText(160),
  seoDescription: nullableText(320),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminActor("editor");

    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that page.");
    }

    const page = await getAdminPageById(id);
    if (!page) return apiNotFound("We could not find that page.");
    return apiOk(page);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-page-detail:get");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-page-update"),
      limit: 60,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) return apiRateLimited();

    const actor = await requireAdminActor("editor");

    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that page.");
    }

    const body = await readJsonObject(request);
    const validation = validateBody(updatePageSchema, body);
    if (!validation.ok) return apiValidationError();

    const updates: TablesUpdate<"pages"> = {};
    if (validation.data.slug !== undefined) updates.slug = validation.data.slug;
    if (validation.data.title !== undefined) updates.title = validation.data.title;
    if (validation.data.excerpt !== undefined) updates.excerpt = validation.data.excerpt;
    if (validation.data.body !== undefined) updates.body = validation.data.body;
    if (validation.data.status !== undefined) updates.status = validation.data.status;
    if (validation.data.seoTitle !== undefined) updates.seo_title = validation.data.seoTitle;
    if (validation.data.seoDescription !== undefined)
      updates.seo_description = validation.data.seoDescription;

    if (Object.keys(updates).length === 0) {
      return apiValidationError("Provide at least one field to update.");
    }

    const before = await getAdminPageById(id);
    if (!before) return apiNotFound("We could not find that page.");

    const after = await updateAdminPage(id, updates);
    if (!after) return apiNotFound("We could not find that page.");

    await writeAuditLog({
      actor,
      action: "page.updated",
      entityTable: "pages",
      entityId: id,
      before,
      after,
      request,
    });
    revalidatePageTags(before.slug);
    if (after.slug !== before.slug) revalidatePageTags(after.slug);

    return apiOk(after);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    if (isUniqueViolation(error)) {
      return apiConflict("A page with that slug already exists.");
    }
    return apiInternalError(error, "admin-page-detail:patch");
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-page-delete"),
      limit: 30,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) return apiRateLimited();

    const actor = await requireAdminActor("editor");

    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that page.");
    }

    const before = await getAdminPageById(id);
    if (!before) return apiNotFound("We could not find that page.");

    const deleted = await deleteAdminPage(id);
    if (!deleted) return apiNotFound("We could not find that page.");

    await writeAuditLog({
      actor,
      action: "page.deleted",
      entityTable: "pages",
      entityId: id,
      before,
      request,
    });
    revalidatePageTags(before.slug);

    return apiOk({ id, deleted: true });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-page-detail:delete");
  }
}

function isUniqueViolation(error: unknown) {
  return (error as { code?: unknown } | null)?.code === "23505";
}

function revalidatePageTags(slug: string) {
  revalidateTag(`page:${slug}`, { expire: 0 });
  revalidateTag("site-chrome", { expire: 0 });
}
