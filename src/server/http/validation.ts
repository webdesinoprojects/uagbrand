import type { ZodError, ZodType } from "zod";

export type ValidationResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      message: string;
      issues: string[];
    };

export async function readJsonObject(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }

  return body as Record<string, unknown>;
}

export function validateBody<T>(
  schema: ZodType<T>,
  body: unknown,
): ValidationResult<T> {
  const result = schema.safeParse(body);

  if (result.success) {
    return {
      ok: true,
      data: result.data,
    };
  }

  return {
    ok: false,
    message: "Please check the submitted fields.",
    issues: flattenZodError(result.error),
  };
}

function flattenZodError(error: ZodError) {
  return error.issues.map((issue) => {
    const path = issue.path.join(".");

    return path ? `${path}: ${issue.message}` : issue.message;
  });
}
