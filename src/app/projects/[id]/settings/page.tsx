export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AzureConfigForm } from "@/components/projects/AzureConfigForm";
import { db } from "@/lib/db";

type SettingsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectSettingsPage({ params }: SettingsPageProps) {
  const { id } = await params;

  const project = await db.project.findUnique({
    where: { id },
    include: {
      azureConfig: true,
    },
  });

  if (!project) {
    notFound();
  }

  if (project.type !== "AZURE_DEVOPS") {
    notFound();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <Link
            href={`/projects/${project.id}`}
            className="text-sm font-medium text-blue-700 hover:underline"
          >
            Voltar ao quadro
          </Link>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Configuração: {project.name}
          </h1>
        </div>

        <AzureConfigForm
          projectId={project.id}
          hasExistingConfig={Boolean(project.azureConfig)}
          initialValues={{
            organization: project.azureConfig?.organization ?? "",
            adoProject: project.azureConfig?.adoProject ?? "",
            assignedToEmail: project.azureConfig?.assignedToEmail ?? "",
          }}
        />
      </div>
    </AppShell>
  );
}
