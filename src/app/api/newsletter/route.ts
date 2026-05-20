import type { NextRequest } from "next/server";
import { z } from "zod";

import { buildRateLimitKey, checkRateLimit } from "@/server/http/rate-limit";
import {
  apiInternalError,
  apiOk,
  apiRateLimited,
  apiValidationError,
} from "@/server/http/response";
import { subscribeNewsletter } from "@/server/public/forms-dal";
import { readJsonObject, validateBody } from "@/server/http/validation";
import type { PublicFormSubmitData } from "@/types/api";

const NEWSLETTER_SOURCES = ["footer", "popup", "checkout", "other"] as const;

const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  source: z.enum(NEWSLETTER_SOURCES).nullish(),
});

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "public-newsletter"),
      limit: 5,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const body = await readJsonObject(request);
    const validation = validateBody(newsletterSchema, body);

    if (!validation.ok) {
      return apiValidationError();
    }

    await subscribeNewsletter({
      email: validation.data.email,
      source: validation.data.source ?? null,
    });

    return apiOk<PublicFormSubmitData>({ received: true }, { status: 201 });
  } catch (error) {
    return apiInternalError(error, "public-newsletter:post");
  }
}
