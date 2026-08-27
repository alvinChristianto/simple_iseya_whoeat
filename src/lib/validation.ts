import { z } from "zod";

export const categorySchema = z.enum(["HO", "LUAR"]);

export const recordInputSchema = z.object({
  employeeId: z.number().int().positive(),
  breadTypeId: z.number().int().positive(),
  category: categorySchema,
});
export type RecordInput = z.infer<typeof recordInputSchema>;

export const nameSchema = z.string().trim().min(1);
export type NameInput = z.infer<typeof nameSchema>;

export const pinSchema = z
  .string()
  .trim()
  .regex(/^\d{4}$/, "PIN harus 4 digit.");
export type PinInput = z.infer<typeof pinSchema>;

export const dateKeySchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid.");

/** Maximum allowed date range in days (inclusive). Prevents runaway queries. */
export const MAX_RANGE_DAYS = 90;

export const dateRangeSchema = z
  .object({
    dari: dateKeySchema,
    sampai: dateKeySchema,
  })
  .refine((v) => v.dari <= v.sampai, {
    message: "Tanggal awal tidak boleh lebih besar dari tanggal akhir.",
  })
  .refine(
    (v) => {
      const msPerDay = 86_400_000;
      const diff =
        (new Date(v.sampai).getTime() - new Date(v.dari).getTime()) /
        msPerDay;
      return diff < MAX_RANGE_DAYS;
    },
    { message: `Rentang tanggal maksimal ${MAX_RANGE_DAYS} hari.` }
  );

export type DateRange = z.infer<typeof dateRangeSchema>;
