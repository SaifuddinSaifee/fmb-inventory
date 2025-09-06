import { z } from "zod";

const dateInputSchema = z
  .union([z.string(), z.date()])
  .transform((value) => {
    if (typeof value === "string") {
      // YYYY-MM-DD fast-path
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      const parsed = new Date(value);
      if (isNaN(parsed.getTime())) throw new Error("Invalid date");
      return parsed.toISOString().slice(0, 10);
    }
    return value.toISOString().slice(0, 10);
  });

export const createWeekSchema = z.object({
  start_date: dateInputSchema,
});

export const updateWeekStatusSchema = z.object({
  status: z.enum(["Draft", "Published", "Closed"]),
});

export const upsertDayPlansSchema = z.object({
  days: z
    .array(
      z.object({
        date: dateInputSchema,
        menu: z.string().optional().nullable(),
        rsvp: z.number().int().min(0),
      })
    )
    .min(1),
});

export const upsertRequirementsSchema = z.object({
  items: z
    .array(
      z.object({
        item_id: z.number().int().positive(),
        required_qty: z.number(),
        to_buy_override: z.number().nullable().optional(),
      })
    )
    .min(1),
});

export const updateInventorySchema = z.object({
  on_hand: z.number(),
});

export const upsertItemSchema = z.object({
  name: z.string().min(1),
  unit: z.enum(["kg", "g", "L", "ml", "pcs"]),
  vendor_id: z.number().int().positive().nullable().optional(),
});

export const updateItemSchema = z.object({
  name: z.string().min(1).optional(),
  unit: z.enum(["kg", "g", "L", "ml", "pcs"]).optional(),
  vendor_id: z.number().int().positive().nullable().optional(),
});

export const upsertVendorSchema = z.object({
  name: z.string().min(1),
  contact_info: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

export const updateVendorSchema = z.object({
  name: z.string().min(1).optional(),
  contact_info: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

export type CreateWeekInput = z.infer<typeof createWeekSchema>;
export type UpdateWeekStatusInput = z.infer<typeof updateWeekStatusSchema>;
export type UpsertDayPlansInput = z.infer<typeof upsertDayPlansSchema>;
export type UpsertRequirementsInput = z.infer<typeof upsertRequirementsSchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
export type UpsertItemInput = z.infer<typeof upsertItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type UpsertVendorInput = z.infer<typeof upsertVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;


