import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarCheck, ListTodo, NotebookPen, Sparkles, UsersRound } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { SidebarNav } from "@/components/navigation/sidebar-nav";
import { SignOutButton } from "@/components/auth/sign-out-button";

const navLinks = [
  { href: "/today", label: "Today", icon: <CalendarCheck className="h-4 w-4" /> },
  { href: "/task-lists", label: "Task lists", icon: <ListTodo className="h-4 w-4" /> },
  { href: "/ai/import", label: "AI import", icon: <Sparkles className="h-4 w-4" /> },
  { href: "/ai/quick-add", label: "Quick add", icon: <NotebookPen className="h-4 w-4" /> },
  { href: "/team", label: "Team", icon: <UsersRound className="h-4 w-4" /> },
];

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: { name: true },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-6 py-10">
        <aside className="w-64 space-y-6">
          <Link href="/today" className="flex items-center gap-3 text-lg font-semibold text-slate-900">
            <div className="rounded-xl bg-slate-900 px-3 py-1 text-sm text-white">TF</div>
            TaskFlow
          </Link>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Company</p>
            <p className="text-base font-semibold text-slate-900">{company?.name ?? "Company"}</p>
            <p className="text-xs text-slate-500">{user.role === "MANAGER" ? "Manager" : "Team member"}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <SidebarNav links={navLinks} />
          </div>

          <SignOutButton />
        </aside>

        <main className="flex-1 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">{children}</main>
      </div>
    </div>
  );
}
