"use client";

import { useState, useTransition } from "react";
import type { TaskPriority, TaskStatus } from "@/generated/prisma";
import { updateTaskInstanceAction } from "./actions";
import { cn } from "@/lib/utils";

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  HIGH: "text-rose-600",
  NORMAL: "text-amber-600",
  LOW: "text-emerald-600",
};

type TaskItemCardProps = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  category?: string | null;
  note?: string | null;
  assignedTo?: string | null;
  date: string;
  canUpdate: boolean;
};

export function TaskItemCard({ id, title, status, priority, category, note, assignedTo, date, canUpdate }: TaskItemCardProps) {
  const [draftNote, setDraftNote] = useState(note ?? "");
  const [lastSaved, setLastSaved] = useState(note ?? "");
  const [isPending, startTransition] = useTransition();

  const toggleStatus = () => {
    if (!canUpdate) return;
    const nextStatus: TaskStatus = status === "DONE" ? "OPEN" : "DONE";
    startTransition(async () => {
      await updateTaskInstanceAction({ id, status: nextStatus, date });
    });
  };

  const saveNote = () => {
    if (!canUpdate || draftNote === lastSaved) return;
    startTransition(async () => {
      await updateTaskInstanceAction({ id, note: draftNote, date });
      setLastSaved(draftNote);
    });
  };

  const statusLabel = status === "DONE" ? "Done" : status === "SKIPPED" ? "Skipped" : "Open";
  const statusClasses =
    status === "DONE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "SKIPPED"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-slate-900">{title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className={cn("font-semibold", PRIORITY_COLORS[priority])}>{priority.toLowerCase()}</span>
            {category ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{category}</span> : null}
            {assignedTo ? <span>Assigned to {assignedTo}</span> : null}
          </div>
        </div>
        <button
          type="button"
          onClick={toggleStatus}
          disabled={!canUpdate}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-semibold",
            statusClasses,
            !canUpdate && "opacity-60",
          )}
        >
          {status === "DONE" ? "Mark open" : "Mark done"}
        </button>
      </div>

      <div className="mt-3 text-xs text-slate-500">Status: {statusLabel}</div>

      <div className="mt-3">
        <textarea
          value={draftNote}
          onChange={(event) => setDraftNote(event.target.value)}
          onBlur={saveNote}
          disabled={!canUpdate}
          maxLength={400}
          className="h-20 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none disabled:opacity-50"
          placeholder="Add a quick note"
        />
        <div className="mt-1 flex justify-between text-xs text-slate-500">
          <span>{draftNote.length}/400</span>
          <span>{isPending ? "Saving..." : draftNote === lastSaved ? "Saved" : "Unsaved changes"}</span>
        </div>
      </div>
    </div>
  );
}
