import { z } from "zod";

import {
  AddressOperationError,
  deleteCustomerAddress,
  getCustomerAddressById,
  updateCustomerAddress,
} from "@/server/account/addresses-dal";
import { updateAddressSchema } from "@/server/account/address-validation";
import { getCurrentCustomerSession } from "@/server/auth/customer-session";
import { buildRateLimitKey, checkRateLimit } from "@/server/http/rate-limit";
import {
  apiConflict,
  apiInternalError,
  apiNotFound,
  apiOk,
  apiRateLimited,
  apiUnauthorized,
  apiValidationError,
} from "@/server/http/response";
import { readJsonObject, validateBody } from "@/server/http/validation";

const idParamSchema = z.string().uuid();

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getCurrentCustomerSession();
    if (!session.user) {
      return apiUnauthorized();
    }

    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that address.");
    }

    const address = await getCustomerAddressById(session.user.id, id);
    if (!address) {
      return apiNotFound("We could not find that address.");
    }

    return apiOk(address);
  } catch (error) {
    return apiInternalError(error, "account-address-detail:get");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "account-address-update"),
      limit: 30,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const session = await getCurrentCustomerSession();
    if (!session.user) {
      return apiUnauthorized();
    }

    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that address.");
    }

    const body = await readJsonObject(request);
    const validation = validateBody(updateAddressSchema, body);
    if (!validation.ok) {
      return apiValidationError();
    }

    return apiOk(await updateCustomerAddress(session.user.id, id, validation.data));
  } catch (error) {
    if (error instanceof AddressOperationError) {
      if (error.kind === "not_found") {
        return apiNotFound(error.message);
      }

      return apiConflict(error.message);
    }

    return apiInternalError(error, "account-address-detail:patch");
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "account-address-delete"),
      limit: 30,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const session = await getCurrentCustomerSession();
    if (!session.user) {
      return apiUnauthorized();
    }

    const { id } = await context.params;
    if (!idParamSchema.safeParse(id).success) {
      return apiNotFound("We could not find that address.");
    }

    return apiOk(await deleteCustomerAddress(session.user.id, id));
  } catch (error) {
    if (error instanceof AddressOperationError) {
      if (error.kind === "not_found") {
        return apiNotFound(error.message);
      }

      return apiConflict(error.message);
    }

    return apiInternalError(error, "account-address-detail:delete");
  }
}
