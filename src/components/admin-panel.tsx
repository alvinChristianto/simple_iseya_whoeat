"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addBreadType,
  addEmployee,
  setBreadTypeActive,
  setEmployeeActive,
  type ActionResult,
} from "@/app/actions/admin";

type Item = { id: number; name: string; isActive: boolean };
type AddAction = (name: string) => Promise<ActionResult>;
type ToggleAction = (input: { id: number; isActive: boolean }) => Promise<ActionResult>;

function EntitySection({
  title,
  addLabel,
  itemLabel,
  addAction,
  toggleAction,
  items,
}: {
  title: string;
  addLabel: string;
  itemLabel: string;
  addAction: AddAction;
  toggleAction: ToggleAction;
  items: Item[];
}) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAdd = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await addAction(name);
      setMessage(res);
      if (res.ok) {
        setName("");
        router.refresh();
      }
    });
  };

  const handleToggle = (item: Item) => {
    startTransition(async () => {
      await toggleAction({ id: item.id, isActive: !item.isActive });
      router.refresh();
    });
  };

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold text-zinc-900">{title}</h2>

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder={`Nama ${itemLabel}`}
          className="h-12 flex-1 rounded-lg border border-zinc-300 px-3 text-zinc-900 focus:border-zinc-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={isPending}
          className="h-12 rounded-lg bg-green-600 px-4 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
        >
          {addLabel}
        </button>
      </div>

      {message && (
        <p
          className={`mb-4 text-sm ${
            message.ok ? "text-green-700" : "text-red-600"
          }`}
        >
          {message.message}
        </p>
      )}

      <ul className="divide-y divide-zinc-100">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between py-2">
            <span className="text-zinc-900">{item.name}</span>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  item.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {item.isActive ? "Aktif" : "Nonaktif"}
              </span>
              <button
                type="button"
                onClick={() => handleToggle(item)}
                className="rounded-md border border-zinc-300 px-3 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                {item.isActive ? "Nonaktifkan" : "Aktifkan"}
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className="py-3 text-sm text-zinc-400">Belum ada data.</li>
        )}
      </ul>
    </section>
  );
}

export default function AdminPanel({
  employees,
  breadTypes,
}: {
  employees: Item[];
  breadTypes: Item[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <EntitySection
        title="Tambah Karyawan"
        addLabel="Tambah"
        itemLabel="Karyawan"
        addAction={addEmployee}
        toggleAction={setEmployeeActive}
        items={employees}
      />
      <EntitySection
        title="Tambah Jenis Roti"
        addLabel="Tambah"
        itemLabel="Jenis Roti"
        addAction={addBreadType}
        toggleAction={setBreadTypeActive}
        items={breadTypes}
      />
    </div>
  );
}
