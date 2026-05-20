import type { NextRequest } from "next/server";

import { apiInternalError, apiOk } from "@/server/http/response";
import { listPublicReviewsForProductSlug } from "@/server/public/reviews-dal";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const params = request.nextUrl.searchParams;

    const data = await listPublicReviewsForProductSlug(slug, {
      page: params.get("page"),
      pageSize: params.get("pageSize"),
    });

    return apiOk(data);
  } catch (error) {
    return apiInternalError(error, "public-product-reviews:get");
  }
}
