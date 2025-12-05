"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createListFromAiAction } from "./actions";
import { cn } from "@/lib/utils";

type AiTask = {
  title: string;
  description?: string | null;
  suggested_category?: string | null;
  suggested_frequency?: string | null;
  suggested_priority?: string | null;
};

export function AiImportUploader() {
  const router = useRouter();
  const [tasks, setTasks] = useState<AiTask[]>([]);
  const [listName, setListName] = useState("Imported checklist");
  const [importId, setImportId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, startTransition] = useTransition();

  const canCreate = tasks.length > 0 && !isUploading && !isSaving;

  async function handleFile(file: File) {
    setError(null);
    setSuccessMessage(null);
    setTasks([]);
    setImportId(null);
    setIsUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/ai/import", {
        method: "POST",
        body,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed");
      }
      const data = await res.json();
      setTasks(data.tasks ?? []);
      setImportId(data.importId);
      setListName(file.name.replace(/\.[^.]+$/, "") || "Imported checklist");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to process file.");
    } finally {
      setIsUploading(false);
    }
  }

  const previewColumns = useMemo(
    () => ["title", "description", "suggested_category", "suggested_frequency", "suggested_priority"],
    [],
  );

  const handleSubmit = () => {
    if (!canCreate) return;
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("name", listName);
        formData.append("tasks", JSON.stringify(tasks));
        if (importId) {
          formData.append("importId", importId);
        }
        await createListFromAiAction(formData);
        setSuccessMessage("Task list created.");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to create task list.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <label className="flex cursor-pointer flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <input
          type="file"
          accept="image/*,.pdf,.csv,.xlsx,.xls,.txt"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleFile(file);
            }
          }}
        />
        <span className="text-sm font-semibold text-slate-900">Drop a file or click to upload</span>
        <span className="text-xs text-slate-500">Images, PDF, CSV, or Excel</span>
        {isUploading ? <span className="mt-2 text-xs text-slate-500">Thinking...</span> : null}
      </label>
      {error && tasks.length === 0 ? <p className="text-sm text-rose-600">{error}</p> : null}

      {tasks.length > 0 ? (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-500" htmlFor="ai-list-name">
              Task list name
            </label>
            <input
              id="ai-list-name"
              value={listName}
              onChange={(event) => setListName(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            />
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {previewColumns.map((column) => (
                    <th key={column} className="px-3 py-2">
                      {column.replace("suggested_", "").replace("_", " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, index) => (
                  <tr key={`${task.title}-${index}`} className="border-t border-slate-100">
                    {previewColumns.map((column) => (
                      <td key={column} className="px-3 py-2 text-slate-700">
                        {(task as Record<string, string | null | undefined>)[column] ?? "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canCreate}
              className={cn(
                "rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white",
                (!canCreate || isSaving) && "opacity-60",
              )}
            >
              {isSaving ? "Creating..." : "Create task list"}
            </button>
            {error ? <span className="text-sm text-rose-600">{error}</span> : null}
            {successMessage ? <span className="text-sm text-emerald-600">{successMessage}</span> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
