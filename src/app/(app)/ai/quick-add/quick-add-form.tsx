"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createListFromAiAction } from "../import/actions";
import { addAiTasksToExistingListAction } from "./actions";
import { cn } from "@/lib/utils";

type TaskListOption = {
  id: string;
  name: string;
};

type AiTask = {
  title: string;
  description?: string | null;
  suggested_category?: string | null;
  suggested_frequency?: string | null;
  suggested_priority?: string | null;
};

export function QuickAddForm({ lists }: { lists: TaskListOption[] }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [tasks, setTasks] = useState<AiTask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const defaultMode: "existing" | "new" = lists.length ? "existing" : "new";
  const [mode, setMode] = useState<"existing" | "new">(defaultMode);
  const [selectedList, setSelectedList] = useState(lists[0]?.id ?? "");
  const [newListName, setNewListName] = useState("AI quick list");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, startTransition] = useTransition();

  const canSave = tasks.length > 0 && !isSaving;

  async function generateTasks() {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/quick-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: prompt }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "AI request failed");
      }
      const data = await res.json();
      setTasks(data.tasks ?? []);
      setSuccess(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to parse tasks.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleSave = () => {
    if (!canSave) return;
    setError(null);
    setSuccess(null);
    if (mode === "existing" && !selectedList) {
      setError("Select a task list.");
      return;
    }
    startTransition(async () => {
      try {
        if (mode === "existing") {
          const formData = new FormData();
          formData.append("taskListId", selectedList);
          formData.append("tasks", JSON.stringify(tasks));
          await addAiTasksToExistingListAction(formData);
          setSuccess("Tasks added to list.");
        } else {
          const formData = new FormData();
          formData.append("name", newListName || "AI quick list");
          formData.append("tasks", JSON.stringify(tasks));
          await createListFromAiAction(formData);
          setSuccess("New task list created.");
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to save tasks.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="e.g. Tomorrow clean the bar, every Friday deep clean the fryer..."
        className="min-h-[120px] w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
      />
      <button
        type="button"
        onClick={generateTasks}
        disabled={isLoading || !prompt.trim()}
        className={cn(
          "rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white",
          (isLoading || !prompt.trim()) && "opacity-60",
        )}
      >
        {isLoading ? "Analyzing..." : "Generate tasks"}
      </button>

      {tasks.length > 0 ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            {tasks.length} tasks detected.
          </div>
          <div className="rounded-2xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Frequency</th>
                  <th className="px-3 py-2">Priority</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, index) => (
                  <tr key={`${task.title}-${index}`} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <p className="font-semibold text-slate-900">{task.title}</p>
                      {task.description ? <p className="text-xs text-slate-500">{task.description}</p> : null}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{task.suggested_frequency ?? "unknown"}</td>
                    <td className="px-3 py-2 text-slate-600">{task.suggested_priority ?? "normal"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="target-mode"
                  value="existing"
                  checked={mode === "existing"}
                  disabled={!lists.length}
                  onChange={() => lists.length && setMode("existing")}
                />
                Add to existing list
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="target-mode"
                  value="new"
                  checked={mode === "new"}
                  onChange={() => setMode("new")}
                />
                Create new list
              </label>
            </div>

            {mode === "existing" ? (
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                value={selectedList}
                onChange={(event) => setSelectedList(event.target.value)}
              >
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={newListName}
                onChange={(event) => setNewListName(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                placeholder="New list name"
              />
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className={cn(
                "w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white",
                (!canSave || isSaving) && "opacity-60",
              )}
            >
              {isSaving ? "Saving..." : "Save tasks"}
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
    </div>
  );
}
