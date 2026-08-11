"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginWithPin } from "@/app/actions/admin";

export default function PinGate() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await loginWithPin(pin);
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.message);
        setPin("");
        inputRef.current?.focus();
      }
    });
  };

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4">
      <h1 className="mb-2 text-2xl font-bold text-zinc-900">Admin</h1>
      <p className="mb-5 text-sm text-zinc-600">
        Masukkan PIN untuk mengakses halaman admin.
      </p>
      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        maxLength={4}
        autoFocus
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        className="mb-4 h-14 w-full rounded-lg border border-zinc-300 px-4 text-center text-2xl tracking-[0.5em] text-zinc-900 focus:border-zinc-500 focus:outline-none"
        placeholder="••••"
      />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={isPending || pin.length !== 4}
        className="h-14 w-full rounded-lg bg-zinc-900 text-lg font-semibold text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Memeriksa..." : "Masuk"}
      </button>
    </main>
  );
}
