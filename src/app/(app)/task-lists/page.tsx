import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { formatDateParam } from "@/lib/date";
import {
  deleteTaskAction,
  deleteTaskListAction,
  generateTaskListInstancesAction,
  updateTaskAction,
  updateTaskListAction,
} from "./actions";
import { NewTaskListForm } from "./new-list-form";
import { AddTaskForm } from "./add-task-form";
import { TaskListsRealtimeBridge } from "./realtime-bridge";

export const metadata: Metadata = {
  title: "Task lists",
};

const frequencyOptions = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "ONCE", label: "One time" },
  { value: "UNKNOWN", label: "Unknown" },
];

const priorityOptions = [
  { value: "HIGH", label: "High" },
  { value: "NORMAL", label: "Normal" },
  { value: "LOW", label: "Low" },
];

export default async function TaskListsPage() {
  const currentUser = await requireUser();
  const taskLists = await prisma.taskList.findMany({
    where: { companyId: currentUser.companyId },
    include: {
      tasks: {
        where: { isActive: true },
        orderBy: [{ defaultPriority: "desc" }, { title: "asc" }],
      },
    },
    orderBy: { createdAt: "asc" },
  });
  const dateParam = formatDateParam(new Date());

  return (
    <div className="space-y-8">
      <TaskListsRealtimeBridge companyId={currentUser.companyId} />
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Task lists</p>
        <h1 className="text-3xl font-semibold text-slate-900">Recurring checklists</h1>
        <p className="text-sm text-slate-500">Manage reusable checklists for every location and shift.</p>
      </header>

      {currentUser.role === "MANAGER" ? (
        <NewTaskListForm />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          You can browse checklists below. Ask a manager if you need updates.
        </div>
      )}

      <div className="space-y-6">
        {taskLists.map((taskList) => (
          <section key={taskList.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">List</p>
                <h2 className="text-2xl font-semibold text-slate-900">{taskList.name}</h2>
                <p className="text-sm text-slate-500">{taskList.description ?? "No description."}</p>
              </div>
              {currentUser.role === "MANAGER" ? (
                <div className="flex flex-wrap items-center gap-3">
                  <form action={generateTaskListInstancesAction}>
                    <input type="hidden" name="taskListId" value={taskList.id} />
                    <input type="hidden" name="date" value={dateParam} />
                    <button
                      type="submit"
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                    >
                      Generate today&apos;s tasks
                    </button>
                  </form>
                  <form action={deleteTaskListAction}>
                    <input type="hidden" name="listId" value={taskList.id} />
                    <button
                      type="submit"
                      className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      Delete list
                    </button>
                  </form>
                </div>
              ) : null}
            </div>

            {currentUser.role === "MANAGER" ? (
              <form action={updateTaskListAction} className="mt-4 grid gap-4 md:grid-cols-2">
                <input type="hidden" name="listId" value={taskList.id} />
                <div className="space-y-1">
                  <label className="text-xs text-slate-500" htmlFor={`name-${taskList.id}`}>
                    Name
                  </label>
                  <input
                    id={`name-${taskList.id}`}
                    name="name"
                    defaultValue={taskList.name}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500" htmlFor={`location-${taskList.id}`}>
                    Location
                  </label>
                  <input
                    id={`location-${taskList.id}`}
                    name="location"
                    defaultValue={taskList.location ?? ""}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500" htmlFor={`group-${taskList.id}`}>
                    Group
                  </label>
                  <input
                    id={`group-${taskList.id}`}
                    name="groupName"
                    defaultValue={taskList.groupName ?? ""}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500" htmlFor={`frequency-${taskList.id}`}>
                    Default frequency
                  </label>
                  <select
                    id={`frequency-${taskList.id}`}
                    name="defaultFrequency"
                    defaultValue={taskList.defaultFrequency}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  >
                    {frequencyOptions.map((frequency) => (
                      <option key={frequency.value} value={frequency.value}>
                        {frequency.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs text-slate-500" htmlFor={`description-${taskList.id}`}>
                    Description
                  </label>
                  <textarea
                    id={`description-${taskList.id}`}
                    name="description"
                    defaultValue={taskList.description ?? ""}
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Save list details
                  </button>
                </div>
              </form>
            ) : null}

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Tasks ({taskList.tasks.length})</p>
              </div>
              {taskList.tasks.length ? (
                currentUser.role === "MANAGER" ? (
                  <div className="space-y-3">
                    {taskList.tasks.map((task) => (
                      <form
                        key={task.id}
                        action={updateTaskAction}
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <input type="hidden" name="taskId" value={task.id} />
                        <input type="hidden" name="taskListId" value={taskList.id} />
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <label className="text-xs text-slate-500" htmlFor={`task-title-${task.id}`}>
                              Title
                            </label>
                            <input
                              id={`task-title-${task.id}`}
                              name="title"
                              defaultValue={task.title}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-slate-500" htmlFor={`task-category-${task.id}`}>
                              Category
                            </label>
                            <input
                              id={`task-category-${task.id}`}
                              name="category"
                              defaultValue={task.category ?? ""}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-slate-500" htmlFor={`task-frequency-${task.id}`}>
                              Frequency
                            </label>
                            <select
                              id={`task-frequency-${task.id}`}
                              name="defaultFrequency"
                              defaultValue={task.defaultFrequency}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                            >
                              {frequencyOptions.map((frequency) => (
                                <option key={frequency.value} value={frequency.value}>
                                  {frequency.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-slate-500" htmlFor={`task-priority-${task.id}`}>
                              Priority
                            </label>
                            <select
                              id={`task-priority-${task.id}`}
                              name="defaultPriority"
                              defaultValue={task.defaultPriority}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                            >
                              {priorityOptions.map((priority) => (
                                <option key={priority.value} value={priority.value}>
                                  {priority.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <button
                            type="submit"
                            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                          >
                            Save task
                          </button>
                          <button
                            type="submit"
                            formAction={deleteTaskAction}
                            className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </div>
                      </form>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {taskList.tasks.map((task) => (
                      <div key={task.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <p className="font-semibold text-slate-900">{task.title}</p>
                        <p className="text-xs text-slate-500">
                          {task.category ?? "General"} • {task.defaultFrequency.toLowerCase()} • {" "}
                          {task.defaultPriority.toLowerCase()}
                        </p>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                  No tasks yet.
                </p>
              )}
            </div>

            {currentUser.role === "MANAGER" ? <AddTaskForm taskListId={taskList.id} /> : null}
          </section>
        ))}
      </div>
    </div>
  );
}
