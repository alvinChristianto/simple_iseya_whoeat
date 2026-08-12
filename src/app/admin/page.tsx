import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/app/actions/admin";
import PinGate from "@/components/pin-gate";
import AdminPanel from "@/components/admin-panel";

export default async function Admin() {
  if (!(await isAdmin())) {
    return <PinGate />;
  }

  const [employees, breadTypes] = await Promise.all([
    prisma.employee.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: { id: true, name: true, isActive: true },
    }),
    prisma.breadType.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: { id: true, name: true, isActive: true },
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
      <h1 className="mb-5 text-2xl font-bold text-zinc-900">Admin</h1>
      <AdminPanel employees={employees} breadTypes={breadTypes} />
    </main>
  );
}
