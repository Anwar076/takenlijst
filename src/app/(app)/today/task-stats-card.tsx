type TaskStats = {
  total: number;
  done: number;
  open: number;
  skipped: number;
};

export function TaskStatsCard({ stats }: { stats: TaskStats }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">Today&apos;s progress</p>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
        <div>
          <p className="text-2xl font-semibold text-slate-900">{stats.total}</p>
          <p className="text-xs text-slate-500">Total</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-emerald-600">{stats.done}</p>
          <p className="text-xs text-slate-500">Done</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-amber-600">{stats.open}</p>
          <p className="text-xs text-slate-500">Open</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">Skipped: {stats.skipped}</p>
    </section>
  );
}

export type { TaskStats };
