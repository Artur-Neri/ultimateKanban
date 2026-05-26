export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { ProjectList } from "@/components/projects/ProjectList";
import { db } from "@/lib/db";

export default async function ProjectsPage() {
  const projects = await db.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { tasks: true },
      },
      azureConfig: {
        select: {
          organization: true,
          adoProject: true,
          assignedToEmail: true,
        },
      },
    },
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Projetos</h1>
          <p className="mt-2 text-sm text-slate-500">
            Gerencie quadros manuais e projetos integrados ao Azure DevOps.
          </p>
        </div>
        <ProjectList projects={projects} />
      </div>
    </AppShell>
  );
}
