"use client";

import { useActionState } from "react";
import { loginAction, loginInitialState } from "./actions";
import { cn } from "@/lib/utils";

type LoginFormProps = {
  redirectTo?: string;
};

export function LoginForm({ redirectTo = "/today" }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginAction, loginInitialState);

  return (
    <form
      action={formAction}
      className="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur"
    >
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div className="space-y-2 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">taskflow</p>
        <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
        <p className="text-sm text-slate-500">Enter your credentials to continue.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
            placeholder="you@company.com"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <label htmlFor="password" className="font-medium text-slate-700">
              Password
            </label>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none"
            placeholder="••••••••"
          />
        </div>
      </div>

      <div aria-live="polite" className="min-h-[1.5rem] text-sm text-rose-600">
        {state.status === "error" ? state.message : null}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          "w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition",
          isPending ? "opacity-60" : "hover:bg-slate-800",
        )}
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>

      <p className="text-center text-xs text-slate-500">
        Demo accounts: maya.manager@example.com / password123
      </p>
    </form>
  );
}
