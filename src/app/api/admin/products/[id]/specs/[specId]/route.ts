import { revalidateTag } from "next/cache";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  deleteAdminProductSpecification,
  getAdminProductById,
  getAdminProductSpecificationById,
  updateAdminProductSpecification,
} from "@/server/admin/products-dal";
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
import type { TablesUpdate } from "@/types/supabase";

const idParamSchema = z.string().uuid();
const nullableText = (max: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().max(max).nullable().optional(),
  );

const updateSpecSchema = z.object({
  label: z.string().trim().min(1).max(120).optional(),
  value: z.string().trim().min(1).max(1000).optional(),
  groupName: nullableText(120),
  sortOrder: z.number().int().min(0).max(100000).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; specId: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-product-spec-update"),
      limit: 80,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const actor = await requireAdminActor("editor");
    const refs = await validateProductAndSpec(await context.params);

    if ("response" in refs) {
      return refs.response;
    }

    const body = await readJsonObject(request);
    const validation = validateBody(updateSpecSchema, body);

    if (!validation.ok) {
      return apiValidationError();
    }

    const updates = toSpecUpdate(validation.data);
    if (Object.keys(updates).length === 0) {
      return apiValidationError("Provide at least one field to update.");
    }

    const after = await updateAdminProductSpecification(
      refs.product.id,
      refs.spec.id,
      updates,
    );

    if (!after) {
      return apiNotFound("We could not find that product specification.");
    }

    await writeAuditLog({
      actor,
      action: "product_specification.updated",
      entityTable: "product_specifications",
      entityId: refs.spec.id,
      before: refs.spec,
      after,
      request,
    });
    revalidateProductTags(refs.product.slug);

    return apiOk(after);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-product-spec-detail:patch");
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; specId: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-product-spec-delete"),
      limit: 80,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const actor = await requireAdminActor("editor");
    const refs = await validateProductAndSpec(await context.params);

    if ("response" in refs) {
      return refs.response;
    }

    const deleted = await deleteAdminProductSpecification(
      refs.product.id,
      refs.spec.id,
    );

    if (!deleted) {
      return apiNotFound("We could not find that product specification.");
    }

    await writeAuditLog({
      actor,
      action: "product_specification.deleted",
      entityTable: "product_specifications",
      entityId: refs.spec.id,
      before: refs.spec,
      request,
    });
    revalidateProductTags(refs.product.slug);

    return apiOk({ id: refs.spec.id, deleted: true });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-product-spec-detail:delete");
  }
}

async function validateProductAndSpec({
  id: productId,
  specId,
}: {
  id: string;
  specId: string;
}) {
  if (
    !idParamSchema.safeParse(productId).success ||
    !idParamSchema.safeParse(specId).success
  ) {
    return { response: apiNotFound("We could not find that product specification.") };
  }

  const product = await getAdminProductById(productId);
  if (!product) {
    return { response: apiNotFound("We could not find that product.") };
  }

  const spec = await getAdminProductSpecificationById(productId, specId);
  if (!spec) {
    return { response: apiNotFound("We could not find that product specification.") };
  }

  return { product, spec };
}

function toSpecUpdate(
  data: z.infer<typeof updateSpecSchema>,
): TablesUpdate<"product_specifications"> {
  const updates: TablesUpdate<"product_specifications"> = {};

  if (data.label !== undefined) updates.label = data.label;
  if (data.value !== undefined) updates.value = data.value;
  if (data.groupName !== undefined) updates.group_name = data.groupName;
  if (data.sortOrder !== undefined) updates.sort_order = data.sortOrder;

  return updates;
}

function revalidateProductTags(slug: string) {
  revalidateTag("products", { expire: 0 });
  revalidateTag("home-page", { expire: 0 });
  revalidateTag(`product:${slug}`, { expire: 0 });
}
