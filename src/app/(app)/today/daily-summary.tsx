"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function DailySummary({ date }: { date: string }) {
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/daily-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to generate summary");
      }
      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate summary.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-slate-900">AI daily summary</p>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading}
          className={cn(
            "rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-900",
            isLoading && "opacity-60",
          )}
        >
          {isLoading ? "Summarizing..." : "Generate"}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
      {summary ? <p className="mt-3 text-sm text-slate-700">{summary}</p> : null}
    </section>
  );
}
