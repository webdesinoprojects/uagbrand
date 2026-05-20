import { revalidateTag } from "next/cache";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  createAdminProductSpecification,
  getAdminProductById,
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
import type { TablesInsert } from "@/types/supabase";

const idParamSchema = z.string().uuid();
const nullableText = (max: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().max(max).nullable().optional(),
  );

const createSpecSchema = z.object({
  label: z.string().trim().min(1).max(120),
  value: z.string().trim().min(1).max(1000),
  groupName: nullableText(120),
  sortOrder: z.number().int().min(0).max(100000).default(0),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-product-spec-create"),
      limit: 80,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const actor = await requireAdminActor("editor");
    const { id: productId } = await context.params;

    if (!idParamSchema.safeParse(productId).success) {
      return apiNotFound("We could not find that product.");
    }

    const product = await getAdminProductById(productId);
    if (!product) {
      return apiNotFound("We could not find that product.");
    }

    const body = await readJsonObject(request);
    const validation = validateBody(createSpecSchema, body);

    if (!validation.ok) {
      return apiValidationError();
    }

    const input: TablesInsert<"product_specifications"> = {
      product_id: productId,
      label: validation.data.label,
      value: validation.data.value,
      group_name: validation.data.groupName ?? null,
      sort_order: validation.data.sortOrder,
    };

    const created = await createAdminProductSpecification(input);
    await writeAuditLog({
      actor,
      action: "product_specification.created",
      entityTable: "product_specifications",
      entityId: created.id,
      after: created,
      request,
    });
    revalidateProductTags(product.slug);

    return apiOk(created, { status: 201 });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-product-specs:post");
  }
}

function revalidateProductTags(slug: string) {
  revalidateTag("products", { expire: 0 });
  revalidateTag("home-page", { expire: 0 });
  revalidateTag(`product:${slug}`, { expire: 0 });
}
