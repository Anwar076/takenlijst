"use client";

import { useTransition } from "react";
import { generateTaskInstancesAction } from "./actions";
import { Sparkles } from "lucide-react";

export function GenerateTasksButton({ date }: { date: string }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      await generateTaskInstancesAction({ date });
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
    >
      <Sparkles className="h-4 w-4" />
      {isPending ? "Generating..." : "Generate tasks"}
    </button>
  );
}
