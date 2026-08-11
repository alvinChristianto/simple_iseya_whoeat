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
