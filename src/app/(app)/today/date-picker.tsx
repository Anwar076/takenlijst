"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function TodayDatePicker({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateDate = (next: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.set("date", next);
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <label className="text-sm text-slate-600">
      Date
      <input
        type="date"
        value={value}
        onChange={(event) => updateDate(event.target.value)}
        className="ml-3 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-slate-900 focus:outline-none"
        disabled={isPending}
      />
    </label>
  );
}
