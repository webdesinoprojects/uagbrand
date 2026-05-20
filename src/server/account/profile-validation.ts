import { z } from "zod";

import { optionalIndianMobileSchema } from "@/server/commerce/india-validation";

export const updateProfileSchema = z
  .object({
    fullName: z
      .union([
        z.string().trim().min(2).max(120),
        z.literal("").transform(() => null),
        z.null(),
      ])
      .optional(),
    phone: optionalIndianMobileSchema,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Please provide at least one field to update.",
  });
