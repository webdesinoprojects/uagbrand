import type { NextRequest } from "next/server";

import { apiInternalError, apiOk } from "@/server/http/response";
import { getPublicProducts } from "@/server/public/products-dal";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    return apiOk(
      await getPublicProducts({
        brand: searchParams.get("brand") ?? undefined,
        category: searchParams.get("category") ?? undefined,
        delivery: searchParams.get("delivery") ?? undefined,
        page: searchParams.get("page"),
        pageSize: searchParams.get("pageSize"),
        q: searchParams.get("q") ?? searchParams.get("search") ?? undefined,
        sort: searchParams.get("sort") ?? undefined,
        warranty: searchParams.get("warranty") ?? undefined,
      }),
    );
  } catch (error) {
    return apiInternalError(error, "public-products:get");
  }
}
