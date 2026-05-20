import { z } from "zod";

import { getCustomerOrderById } from "@/server/account/orders-dal";
import { getCurrentCustomerSession } from "@/server/auth/customer-session";
import {
  apiInternalError,
  apiNotFound,
  apiOk,
  apiUnauthorized,
} from "@/server/http/response";

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
      return apiNotFound("We could not find that order.");
    }

    const order = await getCustomerOrderById(session.user.id, id);
    if (!order) {
      return apiNotFound("We could not find that order.");
    }

    return apiOk(order);
  } catch (error) {
    return apiInternalError(error, "orders-detail:get");
  }
}
