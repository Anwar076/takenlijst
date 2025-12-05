"use client";

import { useActionState } from "react";
import { inviteInitialState, inviteUserAction } from "./actions";
import { cn } from "@/lib/utils";

export function InviteUserForm() {
  const [state, formAction, isPending] = useActionState(inviteUserAction, inviteInitialState);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Add teammate</h3>
        <p className="text-sm text-slate-500">Create a new login for your company.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="name">
            Full name
          </label>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            id="name"
            name="name"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            id="email"
            name="email"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="role">
            Role
          </label>
          <select
            id="role"
            name="role"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            defaultValue="MEMBER"
          >
            <option value="MEMBER">Member</option>
            <option value="MANAGER">Manager</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="password">
            Temporary password
          </label>
          <input
            type="password"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            id="password"
            name="password"
            minLength={8}
            placeholder="At least 8 characters"
            required
          />
        </div>
      </div>

      <div aria-live="polite" className="min-h-[1.5rem] text-sm">
        {state.status === "error" ? <span className="text-rose-600">{state.message}</span> : null}
        {state.status === "success" ? <span className="text-emerald-600">{state.message}</span> : null}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white",
          isPending ? "opacity-60" : "hover:bg-slate-800",
        )}
      >
        {isPending ? "Creating..." : "Create user"}
      </button>
    </form>
  );
}
