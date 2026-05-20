import type { NextRequest } from "next/server";

import { listCustomerOrders } from "@/server/account/orders-dal";
import { getCurrentCustomerSession } from "@/server/auth/customer-session";
import {
  apiInternalError,
  apiOk,
  apiUnauthorized,
} from "@/server/http/response";

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentCustomerSession();
    if (!session.user) {
      return apiUnauthorized();
    }

    return apiOk(
      await listCustomerOrders(session.user.id, {
        page: request.nextUrl.searchParams.get("page"),
        pageSize: request.nextUrl.searchParams.get("pageSize"),
      }),
    );
  } catch (error) {
    return apiInternalError(error, "orders:get");
  }
}
