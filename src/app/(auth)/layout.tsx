import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-white px-4 py-12">
      <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center">
        {children}
      </div>
    </div>
  );
}
