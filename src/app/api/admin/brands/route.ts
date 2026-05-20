import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  createAdminBrand,
  listAdminBrands,
} from "@/server/admin/catalog-dal";
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

const createBrandSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: slugSchema,
  deal: nullableText(160),
  logoMediaId: z.string().uuid().nullable().optional(),
  status: publishStatusSchema.default("draft"),
  sortOrder: z.number().int().min(0).max(100000).default(0),
  seoTitle: nullableText(160),
  seoDescription: nullableText(320),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminActor("editor");

    const params = request.nextUrl.searchParams;
    const status = parseStatus(params.get("status"));
    const result = await listAdminBrands({
      page: params.get("page"),
      pageSize: params.get("pageSize"),
      q: params.get("q"),
      status,
    });

    return apiOk(result);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-brands:get");
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-brand-create"),
      limit: 60,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const actor = await requireAdminActor("editor");
    const body = await readJsonObject(request);
    const validation = validateBody(createBrandSchema, body);

    if (!validation.ok) {
      return apiValidationError();
    }

    const input: TablesInsert<"brands"> = {
      name: validation.data.name,
      slug: validation.data.slug,
      deal: validation.data.deal ?? null,
      logo_media_id: validation.data.logoMediaId ?? null,
      status: validation.data.status,
      sort_order: validation.data.sortOrder,
      seo_title: validation.data.seoTitle ?? null,
      seo_description: validation.data.seoDescription ?? null,
    };

    const created = await createAdminBrand(input);
    await writeAuditLog({
      actor,
      action: "brand.created",
      entityTable: "brands",
      entityId: created.id,
      after: created,
      request,
    });
    revalidateCatalogTags();

    return apiOk(created, { status: 201 });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    if (isDatabaseConflict(error)) {
      return apiConflict("A brand with that slug already exists.");
    }
    return apiInternalError(error, "admin-brands:post");
  }
}

function parseStatus(value: string | null): PublishStatus | null {
  const result = publishStatusSchema.safeParse(value);
  return result.success ? result.data : null;
}

function revalidateCatalogTags() {
  revalidateTag("catalog", { expire: 0 });
  revalidateTag("home-page", { expire: 0 });
}

function isDatabaseConflict(error: unknown) {
  const code = (error as { code?: unknown } | null)?.code;
  return code === "23505";
}
