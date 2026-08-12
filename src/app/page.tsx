import { prisma } from "@/lib/prisma";
import RecordForm from "@/components/record-form";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [employees, breadTypes] = await Promise.all([
    prisma.employee.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.breadType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <h1 className="mb-5 text-2xl font-bold text-zinc-900">
        Catat Pembagian Roti
      </h1>
      <RecordForm employees={employees} breadTypes={breadTypes} />
    </main>
  );
}
