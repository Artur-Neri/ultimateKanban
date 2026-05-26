export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { UnifiedDashboard } from "@/components/dashboard/UnifiedDashboard";
import { buildDashboardView } from "@/lib/services/dashboard-service";

export default async function HomePage() {
  const groups = await buildDashboardView();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Visão unificada
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Todas as demandas do CLT e freelance agrupadas por projeto.
          </p>
        </div>
        <UnifiedDashboard groups={groups} />
      </div>
    </AppShell>
  );
}
