"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";

const TIME_ZONE = "Asia/Jakarta";

function todayKey(): string {
  return formatInTimeZone(new Date(), TIME_ZONE, "yyyy-MM-dd");
}

function addDays(dateKey: string, days: number): string {
  // Work in UTC arithmetic, then re-express as a Jakarta date key.
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function startOfMonth(dateKey: string): string {
  return dateKey.slice(0, 7) + "-01";
}

function endOfMonth(dateKey: string): string {
  // Last day of the month: go to first of next month, subtract one day.
  const [year, month] = dateKey.split("-").map(Number);
  const firstOfNext = new Date(Date.UTC(year, month, 1)); // month index is already +1
  firstOfNext.setUTCDate(firstOfNext.getUTCDate() - 1);
  return firstOfNext.toISOString().slice(0, 10);
}

function prevMonthKey(dateKey: string): string {
  const [year, month] = dateKey.split("-").map(Number);
  // Go back one month
  const d = new Date(Date.UTC(year, month - 2, 1));
  return d.toISOString().slice(0, 7) + "-01";
}

type Preset = "today" | "7days" | "thisMonth" | "lastMonth" | "custom";

function detectPreset(dari: string, sampai: string): Preset {
  const today = todayKey();
  const sevenAgo = addDays(today, -6);
  const thisMonthStart = startOfMonth(today);
  const thisMonthEnd = endOfMonth(today);
  const lastMonthStart = prevMonthKey(today);
  const lastMonthEnd = endOfMonth(lastMonthStart);

  if (dari === today && sampai === today) return "today";
  if (dari === sevenAgo && sampai === today) return "7days";
  if (dari === thisMonthStart && sampai === thisMonthEnd) return "thisMonth";
  if (dari === lastMonthStart && sampai === lastMonthEnd) return "lastMonth";
  return "custom";
}

const PRESET_LABELS: Record<Preset, string> = {
  today: "Hari Ini",
  "7days": "7 Hari Terakhir",
  thisMonth: "Bulan Ini",
  lastMonth: "Bulan Lalu",
  custom: "Kustom",
};

export default function RangePicker({
  dari,
  sampai,
}: {
  dari: string;
  sampai: string;
}) {
  const router = useRouter();
  const today = todayKey();
  const activePreset = detectPreset(dari, sampai);

  // Local state for the custom date inputs — only committed on Terapkan click
  const [localDari, setLocalDari] = useState(dari);
  const [localSampai, setLocalSampai] = useState(sampai);

  function navigate(d: string, s: string) {
    router.push(`/laporan?dari=${d}&sampai=${s}`);
  }

  function applyPreset(preset: Exclude<Preset, "custom">) {
    const t = todayKey();
    let d: string, s: string;
    switch (preset) {
      case "today":
        d = t;
        s = t;
        break;
      case "7days":
        d = addDays(t, -6);
        s = t;
        break;
      case "thisMonth":
        d = startOfMonth(t);
        s = endOfMonth(t);
        break;
      case "lastMonth": {
        const lm = prevMonthKey(t);
        d = lm;
        s = endOfMonth(lm);
        break;
      }
    }
    setLocalDari(d);
    setLocalSampai(s);
    navigate(d, s);
  }

  function applyCustom() {
    // Guard: sampai must be >= dari
    if (localSampai < localDari) {
      setLocalSampai(localDari);
      navigate(localDari, localDari);
    } else {
      navigate(localDari, localSampai);
    }
  }

  const presets: { key: Exclude<Preset, "custom">; label: string }[] = [
    { key: "today", label: PRESET_LABELS.today },
    { key: "7days", label: PRESET_LABELS["7days"] },
    { key: "thisMonth", label: PRESET_LABELS.thisMonth },
    { key: "lastMonth", label: PRESET_LABELS.lastMonth },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => applyPreset(key)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              activePreset === key
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Custom date range inputs */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm font-medium text-zinc-600">Dari</label>
        <input
          type="date"
          value={localDari}
          max={today}
          onChange={(e) => {
            setLocalDari(e.target.value);
            // If sampai is now before the new dari, clamp it
            if (localSampai < e.target.value) setLocalSampai(e.target.value);
          }}
          className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
        />
        <label className="text-sm font-medium text-zinc-600">Sampai</label>
        <input
          type="date"
          value={localSampai}
          min={localDari}
          max={today}
          onChange={(e) => setLocalSampai(e.target.value)}
          className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={applyCustom}
          className="h-10 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-700"
        >
          Terapkan
        </button>
      </div>
    </div>
  );
}
