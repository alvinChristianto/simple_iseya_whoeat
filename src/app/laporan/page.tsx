import { prisma } from "@/lib/prisma";
import {
  jakartaRangeBoundary,
  jakartaDateRange,
  defaultRange,
  toJakartaKey,
} from "@/lib/dates";
import { dateRangeSchema } from "@/lib/validation";
import RangePicker from "@/components/range-picker";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ dari?: string; sampai?: string }>;
}

export default async function LaporanPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const fallback = defaultRange();

  const parsed = dateRangeSchema.safeParse({
    dari: params.dari ?? fallback.dari,
    sampai: params.sampai ?? fallback.sampai,
  });

  const { dari, sampai } = parsed.success ? parsed.data : fallback;

  const { start, end } = jakartaRangeBoundary(dari, sampai);

  const records = await prisma.breadRecord.findMany({
    where: { recordedAt: { gte: start, lte: end } },
    include: { employee: true, breadType: true },
    orderBy: { recordedAt: "asc" },
  });

  // ── Overall summary ───────────────────────────────────────────────────────
  const totalAll = records.length;
  const hoAll = records.filter((r) => r.category === "HO").length;
  const luarAll = totalAll - hoAll;

  const byBreadType = new Map<string, number>();
  const byEmployee = new Map<string, number>();
  for (const r of records) {
    byBreadType.set(r.breadType.name, (byBreadType.get(r.breadType.name) ?? 0) + 1);
    byEmployee.set(r.employee.name, (byEmployee.get(r.employee.name) ?? 0) + 1);
  }

  // ── Per-day breakdown ─────────────────────────────────────────────────────
  // Index records by their Jakarta date key
  const byDay = new Map<string, typeof records>();
  for (const r of records) {
    const key = toJakartaKey(r.recordedAt);
    const bucket = byDay.get(key) ?? [];
    bucket.push(r);
    byDay.set(key, bucket);
  }

  // Generate every day in the range (include days with zero records)
  const allDays = jakartaDateRange(dari, sampai);

  const isSameDay = dari === sampai;

  // Excel export URL
  const exportUrl = `/api/export/range?dari=${dari}&sampai=${sampai}`;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-zinc-900">Laporan</h1>
      </div>

      {/* Range picker */}
      <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4">
        <RangePicker dari={dari} sampai={sampai} />
      </div>

      {/* Range label */}
      <p className="mb-4 text-sm text-zinc-500">
        {isSameDay
          ? `Menampilkan data untuk ${dari}`
          : `Menampilkan data dari ${dari} hingga ${sampai}`}
      </p>

      {/* Download button */}
      <a
        href={exportUrl}
        className="mb-6 inline-flex h-12 items-center rounded-lg bg-zinc-900 px-5 text-sm font-semibold text-white hover:bg-zinc-700"
      >
        Download Excel
      </a>

      {/* Overall summary */}
      <section className="mb-6">
        <h2 className="mb-3 text-base font-semibold text-zinc-900">
          Ringkasan Keseluruhan
        </h2>
        <div className="mb-3 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-sm text-zinc-500">Total</p>
            <p className="text-2xl font-bold">{totalAll}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-sm text-zinc-500">HO</p>
            <p className="text-2xl font-bold">{hoAll}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="text-sm text-zinc-500">LUAR</p>
            <p className="text-2xl font-bold">{luarAll}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-zinc-900">
              Total per Jenis Roti
            </h3>
            {byBreadType.size === 0 ? (
              <p className="text-sm text-zinc-400">Tidak ada data.</p>
            ) : (
              <ul className="space-y-1 text-sm text-zinc-700">
                {[...byBreadType.entries()].map(([name, count]) => (
                  <li key={name} className="flex justify-between">
                    <span>{name}</span>
                    <span className="font-medium">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-zinc-900">
              Total per Karyawan
            </h3>
            {byEmployee.size === 0 ? (
              <p className="text-sm text-zinc-400">Tidak ada data.</p>
            ) : (
              <ul className="space-y-1 text-sm text-zinc-700">
                {[...byEmployee.entries()].map(([name, count]) => (
                  <li key={name} className="flex justify-between">
                    <span>{name}</span>
                    <span className="font-medium">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Per-day breakdown */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-zinc-900">
          Rincian per Hari
        </h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full min-w-[360px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500">
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">HO</th>
                <th className="px-4 py-3 text-right font-medium">LUAR</th>
              </tr>
            </thead>
            <tbody>
              {allDays.map((day) => {
                const dayRecords = byDay.get(day) ?? [];
                const dayTotal = dayRecords.length;
                const dayHo = dayRecords.filter((r) => r.category === "HO").length;
                const dayLuar = dayTotal - dayHo;
                const isEmpty = dayTotal === 0;

                return (
                  <tr
                    key={day}
                    className="border-b border-zinc-100 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <a
                        href={`/daftar?tanggal=${day}`}
                        className="font-medium text-zinc-900 underline-offset-2 hover:underline"
                      >
                        {day}
                      </a>
                    </td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums ${
                        isEmpty ? "text-zinc-300" : "font-medium"
                      }`}
                    >
                      {dayTotal}
                    </td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums ${
                        isEmpty ? "text-zinc-300" : ""
                      }`}
                    >
                      {dayHo}
                    </td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums ${
                        isEmpty ? "text-zinc-300" : ""
                      }`}
                    >
                      {dayLuar}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
