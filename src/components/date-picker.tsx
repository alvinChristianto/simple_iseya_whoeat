"use client";

import { useRouter } from "next/navigation";

export default function DatePicker({
  dateKey,
  max,
}: {
  dateKey: string;
  max?: string;
}) {
  const router = useRouter();

  return (
    <input
      type="date"
      name="tanggal"
      defaultValue={dateKey}
      max={max}
      onChange={(e) => {
        const value = e.target.value;
        if (value) router.push(`/daftar?tanggal=${value}`);
      }}
      className="h-12 rounded-lg border border-zinc-300 bg-white px-3 text-lg text-zinc-900 focus:border-zinc-500 focus:outline-none"
    />
  );
}
