import type { NextRequest } from "next/server";
import { z } from "zod";

import { buildRateLimitKey, checkRateLimit } from "@/server/http/rate-limit";
import {
  apiInternalError,
  apiOk,
  apiRateLimited,
  apiUnauthorized,
  apiValidationError,
} from "@/server/http/response";
import { submitReview } from "@/server/public/reviews-dal";
import { readJsonObject, validateBody } from "@/server/http/validation";
import { getCurrentUser } from "@/server/supabase/auth";
import type { PublicFormSubmitData } from "@/types/api";

const reviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(200).nullish(),
  body: z.string().trim().max(5000).nullish(),
});

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "public-reviews"),
      limit: 5,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized("Please sign in to leave a review.");
    }

    const body = await readJsonObject(request);
    const validation = validateBody(reviewSchema, body);
    if (!validation.ok) {
      return apiValidationError();
    }

    await submitReview({
      userId: user.id,
      productId: validation.data.productId,
      rating: validation.data.rating,
      title: validation.data.title ?? null,
      body: validation.data.body ?? null,
    });

    return apiOk<PublicFormSubmitData>({ received: true }, { status: 201 });
  } catch (error) {
    return apiInternalError(error, "public-reviews:post");
  }
}
