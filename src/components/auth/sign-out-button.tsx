"use client";

import { useTransition } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(() => {
      void signOut({ callbackUrl: "/login" });
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition",
        "hover:bg-white hover:text-slate-900",
        isPending && "opacity-60",
      )}
      disabled={isPending}
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  );
}
