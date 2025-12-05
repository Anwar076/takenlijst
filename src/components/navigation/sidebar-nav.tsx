"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SidebarLink = {
  href: string;
  label: string;
  icon: ReactNode;
};

export function SidebarNav({ links }: { links: SidebarLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {links.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium",
              isActive
                ? "bg-slate-900 text-white shadow"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <span className="text-base">{link.icon}</span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
