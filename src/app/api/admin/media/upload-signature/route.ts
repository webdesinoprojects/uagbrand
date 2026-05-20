import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { writeAuditLog } from "@/server/admin/audit";
import { buildRateLimitKey, checkRateLimit } from "@/server/http/rate-limit";
import {
  apiForbidden,
  apiInternalError,
  apiOk,
  apiRateLimited,
  apiUnauthorized,
} from "@/server/http/response";
import {
  getImageKitConfig,
  getImageKitUploadAuth,
} from "@/server/media/imagekit";
import type { AdminMediaUploadSignatureData } from "@/types/api";

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "admin-media-upload-signature"),
      limit: 20,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const actor = await requireAdminActor("editor");
    const config = getImageKitConfig();
    const uploadAuth = getImageKitUploadAuth();

    await writeAuditLog({
      actor,
      action: "media.upload_signature.created",
      request,
    });

    return apiOk<AdminMediaUploadSignatureData>({
      token: uploadAuth.token,
      expire: uploadAuth.expire,
      signature: uploadAuth.signature,
      publicKey: config.publicKey,
      urlEndpoint: config.urlEndpoint,
    });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }

    return apiInternalError(error, "admin-media-upload-signature:post");
  }
}
