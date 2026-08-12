import { prisma } from "@/lib/prisma";
import { jakartaDayRange, todayJakartaKey, toJakartaTime } from "@/lib/dates";
import { dateKeySchema } from "@/lib/validation";
import DatePicker from "@/components/date-picker";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ tanggal?: string }>;
}

export default async function DailyRecords({ searchParams }: PageProps) {
  const params = await searchParams;
  const today = todayJakartaKey();
  const rawDate = params.tanggal;
  const dateKey = rawDate && dateKeySchema.safeParse(rawDate).success ? rawDate : today;

  const { start, end } = jakartaDayRange(dateKey);
  const records = await prisma.breadRecord.findMany({
    where: { recordedAt: { gte: start, lte: end } },
    include: { employee: true, breadType: true },
    orderBy: { recordedAt: "asc" },
  });

  const total = records.length;
  const ho = records.filter((r) => r.category === "HO").length;
  const luar = total - ho;

  const byBreadType = new Map<string, number>();
  const byEmployee = new Map<string, number>();
  for (const r of records) {
    byBreadType.set(r.breadType.name, (byBreadType.get(r.breadType.name) ?? 0) + 1);
    byEmployee.set(r.employee.name, (byEmployee.get(r.employee.name) ?? 0) + 1);
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-zinc-900">Daftar Harian</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-zinc-700">Tanggal</label>
          <DatePicker dateKey={dateKey} />
        </div>
      </div>

      <a
        href={`/api/export?tanggal=${dateKey}`}
        className="mb-5 inline-flex h-12 items-center rounded-lg bg-zinc-900 px-5 text-sm font-semibold text-white hover:bg-zinc-700"
      >
        Download Excel
      </a>

      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">Total</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">HO</p>
          <p className="text-2xl font-bold">{ho}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">LUAR</p>
          <p className="text-2xl font-bold">{luar}</p>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">
            Total per Jenis Roti
          </h2>
          <ul className="space-y-1 text-sm text-zinc-700">
            {[...byBreadType.entries()].map(([name, count]) => (
              <li key={name} className="flex justify-between">
                <span>{name}</span>
                <span className="font-medium">{count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">
            Total per Karyawan
          </h2>
          <ul className="space-y-1 text-sm text-zinc-700">
            {[...byEmployee.entries()].map(([name, count]) => (
              <li key={name} className="flex justify-between">
                <span>{name}</span>
                <span className="font-medium">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500">
              <th className="px-4 py-3 font-medium">Waktu</th>
              <th className="px-4 py-3 font-medium">Karyawan</th>
              <th className="px-4 py-3 font-medium">Jenis Roti</th>
              <th className="px-4 py-3 font-medium">Kategori</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-400">
                  Tidak ada catatan pada tanggal ini.
                </td>
              </tr>
            )}
            {records.map((r) => (
              <tr key={r.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-3 tabular-nums">
                  {toJakartaTime(r.recordedAt)} WIB
                </td>
                <td className="px-4 py-3">{r.employee.name}</td>
                <td className="px-4 py-3">{r.breadType.name}</td>
                <td className="px-4 py-3">{r.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
