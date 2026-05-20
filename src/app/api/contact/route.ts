import type { NextRequest } from "next/server";
import { z } from "zod";

import { buildRateLimitKey, checkRateLimit } from "@/server/http/rate-limit";
import {
  apiInternalError,
  apiOk,
  apiRateLimited,
  apiValidationError,
} from "@/server/http/response";
import { submitContactMessage } from "@/server/public/forms-dal";
import { readJsonObject, validateBody } from "@/server/http/validation";
import { getCurrentUser } from "@/server/supabase/auth";
import type { PublicFormSubmitData } from "@/types/api";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(255),
  phone: z.string().trim().max(40).nullish(),
  subject: z.string().trim().max(200).nullish(),
  message: z.string().trim().min(1).max(5000),
});

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey(request, "public-contact"),
      limit: 5,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return apiRateLimited();
    }

    const body = await readJsonObject(request);
    const validation = validateBody(contactSchema, body);

    if (!validation.ok) {
      return apiValidationError();
    }

    const user = await getCurrentUser();

    await submitContactMessage({
      name: validation.data.name,
      email: validation.data.email,
      phone: validation.data.phone ?? null,
      subject: validation.data.subject ?? null,
      message: validation.data.message,
      userId: user?.id ?? null,
    });

    return apiOk<PublicFormSubmitData>({ received: true }, { status: 201 });
  } catch (error) {
    return apiInternalError(error, "public-contact:post");
  }
}
