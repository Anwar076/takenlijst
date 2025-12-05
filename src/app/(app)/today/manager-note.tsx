"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { upsertManagerNoteAction } from "./actions";

type ManagerNoteProps = {
  content: string;
  date: string;
  canEdit: boolean;
};

export function ManagerNote({ content, date, canEdit }: ManagerNoteProps) {
  const [note, setNote] = useState(content);
  const [lastSavedContent, setLastSavedContent] = useState(content);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setNote(content);
    setLastSavedContent(content);
  }, [content]);

  useEffect(() => {
    if (!canEdit) {
      return;
    }

    if (note === lastSavedContent) {
      return;
    }

    const timeout = setTimeout(() => {
      const nextContent = note;
      startTransition(async () => {
        await upsertManagerNoteAction({ content: nextContent, date });
        setLastSavedContent(nextContent);
        setLastSavedAt(new Date());
      });
    }, 600);

    return () => clearTimeout(timeout);
  }, [canEdit, date, lastSavedContent, note, startTransition]);

  const statusLabel = useMemo(() => {
    if (!canEdit) {
      return "";
    }
    if (isPending) {
      return "Saving...";
    }
    if (lastSavedAt) {
      return `Saved ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
    return "Auto-save";
  }, [canEdit, isPending, lastSavedAt]);

  if (!canEdit) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between text-sm">
          <p className="font-semibold text-slate-900">Manager note</p>
          <span className="text-xs text-slate-500">View only</span>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
          {content ? content : "No note for today."}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-sm">
        <p className="font-semibold text-slate-900">Manager note</p>
        <span className="text-xs text-slate-500">{statusLabel}</span>
      </div>
      <textarea
        className="mt-3 h-48 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Remind the team what matters today..."
      />
    </section>
  );
}
