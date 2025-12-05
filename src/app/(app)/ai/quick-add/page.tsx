import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { QuickAddForm } from "./quick-add-form";

export const metadata: Metadata = {
  title: "AI quick add",
};

export default async function QuickAddPage() {
  const user = await requireUser();
  const lists = await prisma.taskList.findMany({
    where: { companyId: user.companyId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">AI</p>
        <h1 className="text-3xl font-semibold text-slate-900">Quick add tasks</h1>
        <p className="text-sm text-slate-500">Describe tasks in plain text and let TaskFlow create them.</p>
      </header>
      <QuickAddForm lists={lists} />
    </div>
  );
}
