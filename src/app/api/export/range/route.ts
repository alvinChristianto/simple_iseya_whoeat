import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  jakartaRangeBoundary,
  defaultRange,
  toJakartaKey,
  toJakartaTime,
} from "@/lib/dates";
import { buildWorkbook, excelContentType } from "@/lib/excel";
import { dateRangeSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const fallback = defaultRange();

  const parsed = dateRangeSchema.safeParse({
    dari: sp.get("dari") ?? fallback.dari,
    sampai: sp.get("sampai") ?? fallback.sampai,
  });

  const { dari, sampai } = parsed.success ? parsed.data : fallback;

  const { start, end } = jakartaRangeBoundary(dari, sampai);

  const records = await prisma.breadRecord.findMany({
    where: { recordedAt: { gte: start, lte: end } },
    include: { employee: true, breadType: true },
    orderBy: { recordedAt: "asc" },
  });

  // Build aggregates for the Summary sheet
  const byBreadType = new Map<string, number>();
  const byEmployee = new Map<string, number>();
  const matrix = new Map<string, number>();
  for (const r of records) {
    byBreadType.set(r.breadType.name, (byBreadType.get(r.breadType.name) ?? 0) + 1);
    byEmployee.set(r.employee.name, (byEmployee.get(r.employee.name) ?? 0) + 1);
    const key = `${r.employee.name}\u0000${r.breadType.name}`;
    matrix.set(key, (matrix.get(key) ?? 0) + 1);
  }

  const rows = records.map((r) => ({
    date: toJakartaKey(r.recordedAt),
    time: toJakartaTime(r.recordedAt),
    employeeName: r.employee.name,
    breadTypeName: r.breadType.name,
    category: r.category,
  }));

  const dateLabel = dari === sampai ? dari : `${dari} – ${sampai}`;

  const totals = {
    dateLabel,
    total: records.length,
    ho: records.filter((r) => r.category === "HO").length,
    luar: records.filter((r) => r.category === "LUAR").length,
    byBreadType: [...byBreadType.entries()].map(([name, count]) => ({ name, count })),
    byEmployee: [...byEmployee.entries()].map(([name, count]) => ({ name, count })),
    matrix: [...matrix.entries()].map(([key, count]) => {
      const [employee, breadType] = key.split("\u0000");
      return { employee, breadType, count };
    }),
  };

  const buffer = await buildWorkbook(rows, totals);

  // Filename: bread-records-DARI-sampai-SAMPAI.xlsx  (or just the date for single-day)
  const filename =
    dari === sampai
      ? `bread-records-${dari}.xlsx`
      : `bread-records-${dari}-sampai-${sampai}.xlsx`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": excelContentType(),
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
