import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import {
  getAdminSiteSettings,
  updateAdminSiteSettings,
} from "@/server/admin/site-settings-dal";
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
import type { TablesUpdate } from "@/types/supabase";

const nullableText = (max: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? null : value,
    z.string().trim().max(max).nullable().optional(),
  );

const settingsSchema = z.object({
  siteName: z.string().trim().min(1).max(120).optional(),
  logoMediaId: z.string().uuid().nullable().optional(),
  contactEmail: nullableText(255),
  contactPhone: nullableText(40),
  addressLabel: nullableText(255),
  footerDescription: nullableText(500),
});

export async function GET() {
  try {
    await requireAdminActor("editor");
    const settings = await getAdminSiteSettings();
    return apiOk(settings);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-store-settings:get");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-store-settings-update"),
      limit: 30,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) return apiRateLimited();

    const actor = await requireAdminActor("editor");
    const body = await readJsonObject(request);
    const validation = validateBody(settingsSchema, body);
    if (!validation.ok) return apiValidationError();

    const updates: TablesUpdate<"site_settings"> = {};
    if (validation.data.siteName !== undefined) {
      updates.site_name = validation.data.siteName;
    }
    if (validation.data.logoMediaId !== undefined) {
      updates.logo_media_id = validation.data.logoMediaId;
    }
    if (validation.data.contactEmail !== undefined) {
      updates.contact_email = validation.data.contactEmail;
    }
    if (validation.data.contactPhone !== undefined) {
      updates.contact_phone = validation.data.contactPhone;
    }
    if (validation.data.addressLabel !== undefined) {
      updates.address_label = validation.data.addressLabel;
    }
    if (validation.data.footerDescription !== undefined) {
      updates.footer_description = validation.data.footerDescription;
    }

    if (Object.keys(updates).length === 0) {
      return apiValidationError("Provide at least one field to update.");
    }

    const before = await getAdminSiteSettings();
    const after = await updateAdminSiteSettings(updates);

    await writeAuditLog({
      actor,
      action: "site_settings.updated",
      entityTable: "site_settings",
      before,
      after,
      request,
    });
    revalidateTag("site-chrome", { expire: 0 });

    return apiOk(after);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-store-settings:patch");
  }
}
