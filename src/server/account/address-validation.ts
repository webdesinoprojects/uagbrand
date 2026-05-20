import { z } from "zod";

import {
  indianMobileSchema,
  indianPincodeSchema,
} from "@/server/commerce/india-validation";

const optionalText = (max: number) =>
  z
    .union([
      z.string().trim().min(1).max(max),
      z.literal("").transform(() => null),
      z.null(),
    ])
    .optional();

const countrySchema = z
  .string()
  .trim()
  .length(2)
  .regex(/^[a-zA-Z]{2}$/)
  .transform((value) => value.toUpperCase());

const addressFields = {
  label: optionalText(60),
  fullName: z.string().trim().min(2).max(120),
  phone: indianMobileSchema,
  line1: z.string().trim().min(3).max(180),
  line2: optionalText(180),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  pincode: indianPincodeSchema,
  country: countrySchema.default("IN"),
  isDefaultShipping: z.boolean().optional(),
  isDefaultBilling: z.boolean().optional(),
};

export const createAddressSchema = z.object(addressFields);

export const updateAddressSchema = z
  .object({
    ...addressFields,
    fullName: addressFields.fullName.optional(),
    phone: addressFields.phone.optional(),
    line1: addressFields.line1.optional(),
    city: addressFields.city.optional(),
    state: addressFields.state.optional(),
    pincode: addressFields.pincode.optional(),
    country: countrySchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Please provide at least one field to update.",
  });
