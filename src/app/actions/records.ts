"use server";

import { prisma } from "@/lib/prisma";
import { recordInputSchema } from "@/lib/validation";

export interface SaveRecordResult {
  ok: boolean;
  message: string;
}

export async function saveRecord(input: unknown): Promise<SaveRecordResult> {
  const parsed = recordInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Data tidak valid." };
  }

  const { employeeId, breadTypeId, category } = parsed.data;

  const [employee, breadType] = await Promise.all([
    prisma.employee.findUnique({ where: { id: employeeId } }),
    prisma.breadType.findUnique({ where: { id: breadTypeId } }),
  ]);

  if (!employee || !employee.isActive) {
    return {
      ok: false,
      message: "Karyawan tidak ditemukan atau sudah tidak aktif.",
    };
  }
  if (!breadType || !breadType.isActive) {
    return { ok: false, message: "Jenis roti tidak tersedia." };
  }

  await prisma.breadRecord.create({
    data: { employeeId, breadTypeId, category },
  });

  return { ok: true, message: "Data berhasil disimpan." };
}
