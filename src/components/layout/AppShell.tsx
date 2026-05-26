import type { ReactNode } from "react";
import { AppNav } from "@/components/layout/AppNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav />
      <main className="mx-auto min-w-0 max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
