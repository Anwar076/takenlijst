"use client";

import { useActionState } from "react";
import { createTaskAction, initialActionState } from "./actions";
import { cn } from "@/lib/utils";

const frequencies = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "ONCE", label: "One time" },
  { value: "UNKNOWN", label: "Unknown" },
];

const priorities = [
  { value: "HIGH", label: "High" },
  { value: "NORMAL", label: "Normal" },
  { value: "LOW", label: "Low" },
];

export function AddTaskForm({ taskListId }: { taskListId: string }) {
  const [state, formAction, isPending] = useActionState(createTaskAction, initialActionState);

  return (
    <form action={formAction} className="rounded-2xl border border-dashed border-slate-300 p-4">
      <input type="hidden" name="taskListId" value={taskListId} />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-slate-600" htmlFor={`title-${taskListId}`}>
            Title
          </label>
          <input
            id={`title-${taskListId}`}
            name="title"
            required
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            placeholder="Clean prep counters"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-600" htmlFor={`category-${taskListId}`}>
            Category
          </label>
          <input
            id={`category-${taskListId}`}
            name="category"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            placeholder="Cleaning"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-600" htmlFor={`frequency-${taskListId}`}>
            Frequency
          </label>
          <select
            id={`frequency-${taskListId}`}
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
        <div className="space-y-1">
          <label className="text-xs text-slate-600" htmlFor={`priority-${taskListId}`}>
            Priority
          </label>
          <select
            id={`priority-${taskListId}`}
            name="defaultPriority"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            defaultValue="NORMAL"
          >
            {priorities.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <label className="text-xs text-slate-600" htmlFor={`description-${taskListId}`}>
          Description
        </label>
        <textarea
          id={`description-${taskListId}`}
          name="description"
          rows={2}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
          placeholder="Steps or reminders"
        />
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs">
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white",
            isPending && "opacity-60",
          )}
        >
          {isPending ? "Adding..." : "Add task"}
        </button>
        {state.message ? (
          <span className={state.status === "error" ? "text-rose-600" : "text-emerald-600"}>{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
