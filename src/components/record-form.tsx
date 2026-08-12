"use client";

import { useRef, useState, useTransition } from "react";
import { saveRecord } from "@/app/actions/records";
import { recordInputSchema } from "@/lib/validation";

type Employee = { id: number; name: string };
type BreadType = { id: number; name: string };
type Category = "HO" | "LUAR";

interface Props {
  employees: Employee[];
  breadTypes: BreadType[];
}

export default function RecordForm({ employees, breadTypes }: Props) {
  const [query, setQuery] = useState("");
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [breadTypeId, setBreadTypeId] = useState("");
  const [category, setCategory] = useState<Category>("HO");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null
  );
  const [isPending, startTransition] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = employees
    .filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 8);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setOpen(true);
        setHighlight(0);
      }
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[highlight];
      if (item) selectEmployee(item);
    }
  };

  const selectEmployee = (employee: Employee) => {
    setQuery(employee.name);
    setEmployeeId(employee.id);
    setOpen(false);
    setMessage(null);
  };

  const handleSubmit = () => {
    const result = recordInputSchema.safeParse({
      employeeId,
      breadTypeId: breadTypeId === "" ? null : Number(breadTypeId),
      category,
    });

    if (!result.success) {
      const issues = result.error.issues;
      if (issues.some((i) => i.path[0] === "employeeId")) {
        setMessage({ ok: false, text: "Nama karyawan wajib dipilih." });
        searchRef.current?.focus();
      } else if (issues.some((i) => i.path[0] === "breadTypeId")) {
        setMessage({ ok: false, text: "Jenis roti wajib dipilih." });
      }
      return;
    }

    startTransition(async () => {
      const res = await saveRecord(result.data);
      if (res.ok) {
        setQuery("");
        setEmployeeId(null);
        setBreadTypeId("");
        setCategory("HO");
        setMessage({ ok: true, text: res.message });
        searchRef.current?.focus();
      } else {
        setMessage({ ok: false, text: res.message });
      }
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {message && (
        <p
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            message.ok
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </p>
      )}

      <div>
        <label
          htmlFor="employee-search"
          className="mb-1.5 block text-sm font-medium text-zinc-700"
        >
          Nama Karyawan
        </label>
        <div className="relative">
          <input
            ref={searchRef}
            id="employee-search"
            type="text"
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setHighlight(0);
              setEmployeeId(null);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setOpen(true);
              setHighlight(0);
            }}
            onBlur={() => setOpen(false)}
            className="h-14 w-full rounded-lg border border-zinc-300 px-4 text-lg text-zinc-900 focus:border-zinc-500 focus:outline-none"
            placeholder="Ketik nama karyawan..."
          />
          {open && filtered.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-zinc-200 bg-white shadow-lg">
              {filtered.map((employee, i) => (
                <li
                  key={employee.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectEmployee(employee);
                  }}
                  onMouseEnter={() => setHighlight(i)}
                  className={`cursor-pointer px-4 py-3 text-zinc-900 ${
                    i === highlight ? "bg-zinc-100" : ""
                  }`}
                >
                  {employee.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="bread-type"
          className="mb-1.5 block text-sm font-medium text-zinc-700"
        >
          Jenis Roti
        </label>
        <select
          id="bread-type"
          value={breadTypeId}
          onChange={(e) => {
            setBreadTypeId(e.target.value);
            setMessage(null);
          }}
          className="h-14 w-full rounded-lg border border-zinc-300 bg-white px-4 text-lg text-zinc-900 focus:border-zinc-500 focus:outline-none"
        >
          <option value="">Pilih jenis roti...</option>
          {breadTypes.map((bt) => (
            <option key={bt.id} value={bt.id}>
              {bt.name}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="mb-1.5 block text-sm font-medium text-zinc-700">
          Kategori
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {(["HO", "LUAR"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
              className={`h-14 rounded-lg border-2 text-lg font-semibold transition-colors ${
                category === value
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-300 bg-white text-zinc-700"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="h-16 w-full rounded-xl bg-green-600 text-xl font-bold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Menyimpan..." : "Simpan"}
      </button>
    </div>
  );
}
