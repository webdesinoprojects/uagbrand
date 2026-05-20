import { revalidateTag } from "next/cache";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  deleteAdminBrand,
  getAdminBrandById,
  updateAdminBrand,
} from "@/server/admin/catalog-dal";
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

const idParamSchema = z.string().uuid();
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

const updateBrandSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  slug: slugSchema.optional(),
  deal: nullableText(160),
  logoMediaId: z.string().uuid().nullable().optional(),
  status: publishStatusSchema.optional(),
  sortOrder: z.number().int().min(0).max(100000).optional(),
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
      return apiNotFound("We could not find that brand.");
    }

    const brand = await getAdminBrandById(id);
    if (!brand) {
      return apiNotFound("We could not find that brand.");
    }

    return apiOk(brand);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-brand-detail:get");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-brand-update"),
      limit: 60,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const actor = await requireAdminActor("editor");

    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that brand.");
    }

    const body = await readJsonObject(request);
    const validation = validateBody(updateBrandSchema, body);

    if (!validation.ok) {
      return apiValidationError();
    }

    const updates = toBrandUpdate(validation.data);
    if (Object.keys(updates).length === 0) {
      return apiValidationError("Provide at least one field to update.");
    }

    const before = await getAdminBrandById(id);
    if (!before) {
      return apiNotFound("We could not find that brand.");
    }

    const after = await updateAdminBrand(id, updates);
    if (!after) {
      return apiNotFound("We could not find that brand.");
    }

    await writeAuditLog({
      actor,
      action: "brand.updated",
      entityTable: "brands",
      entityId: id,
      before,
      after,
      request,
    });
    revalidateCatalogTags();

    return apiOk(after);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    if (isUniqueConflict(error)) {
      return apiConflict("A brand with that slug already exists.");
    }
    return apiInternalError(error, "admin-brand-detail:patch");
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-brand-delete"),
      limit: 30,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const actor = await requireAdminActor("editor");

    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that brand.");
    }

    const before = await getAdminBrandById(id);
    if (!before) {
      return apiNotFound("We could not find that brand.");
    }

    const deleted = await deleteAdminBrand(id);
    if (!deleted) {
      return apiNotFound("We could not find that brand.");
    }

    await writeAuditLog({
      actor,
      action: "brand.deleted",
      entityTable: "brands",
      entityId: id,
      before,
      request,
    });
    revalidateCatalogTags();

    return apiOk({ id, deleted: true });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    if (isForeignKeyConflict(error)) {
      return apiConflict("This brand is linked to products. Archive it instead.");
    }
    return apiInternalError(error, "admin-brand-detail:delete");
  }
}

function toBrandUpdate(
  data: z.infer<typeof updateBrandSchema>,
): TablesUpdate<"brands"> {
  const updates: TablesUpdate<"brands"> = {};

  if (data.name !== undefined) updates.name = data.name;
  if (data.slug !== undefined) updates.slug = data.slug;
  if (data.deal !== undefined) updates.deal = data.deal;
  if (data.logoMediaId !== undefined) updates.logo_media_id = data.logoMediaId;
  if (data.status !== undefined) updates.status = data.status;
  if (data.sortOrder !== undefined) updates.sort_order = data.sortOrder;
  if (data.seoTitle !== undefined) updates.seo_title = data.seoTitle;
  if (data.seoDescription !== undefined) {
    updates.seo_description = data.seoDescription;
  }

  return updates;
}

function revalidateCatalogTags() {
  revalidateTag("catalog", { expire: 0 });
  revalidateTag("home-page", { expire: 0 });
}

function isUniqueConflict(error: unknown) {
  const code = (error as { code?: unknown } | null)?.code;
  return code === "23505";
}

function isForeignKeyConflict(error: unknown) {
  const code = (error as { code?: unknown } | null)?.code;
  return code === "23503";
}
