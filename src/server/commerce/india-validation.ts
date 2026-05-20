import { z } from "zod";

const INDIAN_MOBILE_RE = /^[6-9][0-9]{9}$/;
const INDIAN_PINCODE_RE = /^[1-9][0-9]{5}$/;

export function normalizeIndianMobile(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }

  return digits;
}

export function isValidIndianMobile(value: string) {
  return INDIAN_MOBILE_RE.test(normalizeIndianMobile(value));
}

export function normalizeIndianPincode(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidIndianPincode(value: string) {
  return INDIAN_PINCODE_RE.test(normalizeIndianPincode(value));
}

export const indianMobileSchema = z
  .string()
  .trim()
  .min(1)
  .refine(isValidIndianMobile, {
    message: "Enter a valid 10-digit Indian mobile number.",
  })
  .transform(normalizeIndianMobile);

export const optionalIndianMobileSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.union([indianMobileSchema, z.null()]).optional(),
);

export const indianPincodeSchema = z
  .string()
  .trim()
  .min(1)
  .refine(isValidIndianPincode, {
    message: "Enter a valid 6-digit Indian PIN code.",
  })
  .transform(normalizeIndianPincode);
