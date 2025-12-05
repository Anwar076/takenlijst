import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { InviteUserForm } from "./invite-user-form";

export const metadata: Metadata = {
  title: "Team",
};

export default async function TeamPage() {
  const currentUser = await requireUser();
  const users = await prisma.user.findMany({
    where: { companyId: currentUser.companyId },
    orderBy: [{ role: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Team</p>
        <h1 className="text-3xl font-semibold text-slate-900">Your people</h1>
        <p className="text-sm text-slate-500">Manage who can access TaskFlow for this company.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2 text-right">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-slate-100">
                  <td className="px-3 py-3 font-medium text-slate-900">{user.name ?? "Unknown"}</td>
                  <td className="px-3 py-3 text-slate-600">{user.email}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-900">
                      {user.role.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right text-slate-500">
                    {Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(user.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {currentUser.role === "MANAGER" ? (
          <InviteUserForm />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Need another teammate?</h3>
            <p className="text-sm text-slate-500">Please ask a manager to add them.</p>
          </div>
        )}
      </div>
    </div>
  );
}
