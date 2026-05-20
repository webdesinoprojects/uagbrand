import { AdminAccessError, requireAdminActor } from "@/server/admin/access";
import { getAdminDashboardData } from "@/server/admin/dashboard-dal";
import {
  apiForbidden,
  apiInternalError,
  apiOk,
  apiUnauthorized,
} from "@/server/http/response";

export async function GET() {
  try {
    // Any staff role (admin, editor, support) can view the dashboard.
    await requireAdminActor("staff");
    const data = await getAdminDashboardData();
    return apiOk(data);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return error.status === 401 ? apiUnauthorized() : apiForbidden();
    }
    return apiInternalError(error, "admin-dashboard:get");
  }
}
