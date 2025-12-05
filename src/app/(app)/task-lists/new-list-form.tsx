"use client";

import { useActionState } from "react";
import { createTaskListAction, initialActionState } from "./actions";
import { cn } from "@/lib/utils";

const frequencies = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "ONCE", label: "One time" },
  { value: "UNKNOWN", label: "Unknown" },
];

export function NewTaskListForm() {
  const [state, formAction, isPending] = useActionState(createTaskListAction, initialActionState);

  return (
    <form action={formAction} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Create task list</p>
          <p className="text-xs text-slate-500">Define a recurring checklist for your team.</p>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white",
            isPending && "opacity-60",
          )}
        >
          {isPending ? "Saving..." : "Save"}
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm text-slate-600">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            placeholder="Daily kitchen checklist"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="location" className="text-sm text-slate-600">
            Location / area
          </label>
          <input
            id="location"
            name="location"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            placeholder="Kitchen"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="groupName" className="text-sm text-slate-600">
            Group name
          </label>
          <input
            id="groupName"
            name="groupName"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            placeholder="Morning crew"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="defaultFrequency" className="text-sm text-slate-600">
            Default frequency
          </label>
          <select
            id="defaultFrequency"
            name="defaultFrequency"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            defaultValue="DAILY"
          >
            {frequencies.map((frequency) => (
              <option key={frequency.value} value={frequency.value}>
                {frequency.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <label htmlFor="description" className="text-sm text-slate-600">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
          rows={2}
          placeholder="Opening duties for the kitchen team"
        />
      </div>

      {state.message ? (
        <p className={cn("mt-2 text-xs", state.status === "error" ? "text-rose-600" : "text-emerald-600")}>{state.message}</p>
      ) : null}
    </form>
  );
}
