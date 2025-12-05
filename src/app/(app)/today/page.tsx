import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { fetchTaskInstancesForDate, getManagerNoteForDate } from "@/lib/data/today";
import { formatDateParam, parseDateParam } from "@/lib/date";
import type { TaskPriority } from "@/generated/prisma";
import { ManagerNote } from "./manager-note";
import { TaskItemCard } from "./task-item-card";
import { TodayDatePicker } from "./date-picker";
import { TaskStatsCard, type TaskStats } from "./task-stats-card";
import { GenerateTasksButton } from "./generate-tasks-button";
import { TodayRealtimeBridge } from "./realtime-bridge";
import { DailySummary } from "./daily-summary";

export const metadata: Metadata = {
  title: "Today",
};

const PRIORITY_ORDER: TaskPriority[] = ["HIGH", "NORMAL", "LOW"];

type TaskInstanceWithRelations = Awaited<ReturnType<typeof fetchTaskInstancesForDate>>[number];

type TaskGroup = {
  listId: string;
  listName: string;
  priorities: Array<{
    priority: TaskPriority;
    items: TaskInstanceWithRelations[];
  }>;
};

function buildGroups(instances: TaskInstanceWithRelations[]): TaskGroup[] {
  const map = new Map<string, { name: string; buckets: Record<TaskPriority, TaskInstanceWithRelations[]> }>();

  instances.forEach((instance) => {
    const listId = instance.task.taskList.id;
    const listName = instance.task.taskList.name;
    if (!map.has(listId)) {
      map.set(listId, {
        name: listName,
        buckets: {
          HIGH: [],
          NORMAL: [],
          LOW: [],
        },
      });
    }

    const entry = map.get(listId)!;
    entry.buckets[instance.task.defaultPriority].push(instance);
  });

  return Array.from(map.entries()).map(([listId, value]) => ({
    listId,
    listName: value.name,
    priorities: PRIORITY_ORDER.map((priority) => ({
      priority,
      items: value.buckets[priority].sort((a, b) => a.task.sortOrder - b.task.sortOrder),
    })).filter((group) => group.items.length > 0),
  }));
}

function buildStats(instances: TaskInstanceWithRelations[]): TaskStats {
  const stats: TaskStats = { total: instances.length, done: 0, open: 0, skipped: 0 };
  instances.forEach((instance) => {
    if (instance.status === "DONE") stats.done += 1;
    else if (instance.status === "SKIPPED") stats.skipped += 1;
    else stats.open += 1;
  });
  return stats;
}

function TaskSection({
  title,
  instances,
  dateParam,
  canUpdate,
  emptyMessage,
}: {
  title: string;
  instances: TaskInstanceWithRelations[];
  dateParam: string;
  canUpdate: boolean;
  emptyMessage: string;
}) {
  const groups = buildGroups(instances);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{instances.length} tasks</p>
      </div>
      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.listId} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">{group.listName}</p>
            </div>
            <div className="space-y-3">
              {group.priorities.map((priorityGroup) => (
                <div key={priorityGroup.priority} className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{priorityGroup.priority.toLowerCase()} priority</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {priorityGroup.items.map((instance) => (
                      <TaskItemCard
                        key={`${instance.id}-${instance.status}-${instance.note ?? ""}`}
                        id={instance.id}
                        title={instance.task.title}
                        status={instance.status}
                        priority={instance.task.defaultPriority}
                        category={instance.task.category}
                        note={instance.note}
                        assignedTo={instance.assignedTo?.name ?? null}
                        date={dateParam}
                        canUpdate={canUpdate}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const currentUser = await requireUser();
  const params = await searchParams;
  const dateParamRaw = typeof params?.date === "string" ? params.date : undefined;
  const targetDate = parseDateParam(dateParamRaw);
  const dateParam = formatDateParam(targetDate);

  const [taskInstances, managerNote] = await Promise.all([
    fetchTaskInstancesForDate(currentUser.companyId, targetDate),
    getManagerNoteForDate(currentUser.companyId, targetDate),
  ]);

  const myTasks = taskInstances.filter((instance) => instance.assignedToUserId === currentUser.id);
  const stats = buildStats(taskInstances);

  return (
    <div className="space-y-8">
      <TodayRealtimeBridge companyId={currentUser.companyId} date={dateParam} />
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Today</p>
          <h1 className="text-3xl font-semibold text-slate-900">Daily focus</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <TodayDatePicker value={dateParam} />
          {currentUser.role === "MANAGER" ? <GenerateTasksButton date={dateParam} /> : null}
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[3fr,2fr]">
        <TaskSection
          title="My tasks"
          instances={myTasks}
          dateParam={dateParam}
          canUpdate
          emptyMessage="No tasks assigned to you yet."
        />

        <div className="space-y-4">
          <ManagerNote
            content={managerNote?.content ?? ""}
            date={dateParam}
            canEdit={currentUser.role === "MANAGER"}
          />
          <TaskStatsCard stats={stats} />
          {currentUser.role === "MANAGER" ? <DailySummary date={dateParam} /> : null}
        </div>
      </div>

      {currentUser.role === "MANAGER" ? (
        <TaskSection
          title="All tasks"
          instances={taskInstances}
          dateParam={dateParam}
          canUpdate
          emptyMessage="Generate task instances to populate today."
        />
      ) : null}
    </div>
  );
}
