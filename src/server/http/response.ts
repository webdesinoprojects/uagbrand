import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiFailure = {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
  };
};

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>(
    {
      ok: true,
      data,
    },
    init,
  );
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status = 400,
  init?: ResponseInit,
) {
  return NextResponse.json<ApiFailure>(
    {
      ok: false,
      error: {
        code,
        message,
      },
    },
    {
      ...init,
      status,
    },
  );
}

export function apiInternalError(error: unknown, context: string) {
  unstable_rethrow(error);
  console.error(`[api:${context}]`, error);

  return apiError(
    "INTERNAL_ERROR",
    "Something went wrong. Please try again in a moment.",
    500,
  );
}

export function apiValidationError(message = "Please check the submitted fields.") {
  return apiError("VALIDATION_ERROR", message, 422);
}

export function apiUnauthorized(message = "Please sign in to continue.") {
  return apiError("UNAUTHORIZED", message, 401);
}

export function apiForbidden(message = "You do not have access to this action.") {
  return apiError("FORBIDDEN", message, 403);
}

export function apiNotFound(message = "We could not find that item.") {
  return apiError("NOT_FOUND", message, 404);
}

export function apiConflict(message = "This item changed. Please refresh and try again.") {
  return apiError("CONFLICT", message, 409);
}

export function apiRateLimited(message = "Too many attempts. Please wait and try again.") {
  return apiError("RATE_LIMITED", message, 429);
}
