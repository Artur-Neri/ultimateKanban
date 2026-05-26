export const dynamic = "force-dynamic";

import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AzureConfigForm } from "@/components/projects/AzureConfigForm";
import { GoogleCalendarConfigForm } from "@/components/projects/GoogleCalendarConfigForm";
import { db } from "@/lib/db";

type SettingsPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ google_connected?: string }>;
};

export default async function ProjectSettingsPage({
  params,
  searchParams,
}: SettingsPageProps) {
  const { id } = await params;
  const { google_connected: googleConnected } = await searchParams;

  const project = await db.project.findUnique({
    where: { id },
    include: {
      azureConfig: true,
    },
  });

  if (!project) {
    notFound();
  }

  const isManual = project.type === "MANUAL";
  const isAzure = project.type === "AZURE_DEVOPS";

  if (!isManual && !isAzure) {
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
          <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
            Configuração: {project.name}
          </h1>
          {googleConnected && isManual ? (
            <p className="mt-2 text-sm text-emerald-700">
              Conta Google conectada. Escolha ou crie uma agenda abaixo.
            </p>
          ) : null}
        </div>

        {isManual ? (
          <Suspense
            fallback={
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
                <p className="text-sm text-slate-500">Carregando configuração...</p>
              </div>
            }
          >
            <GoogleCalendarConfigForm
              projectId={project.id}
              projectName={project.name}
            />
          </Suspense>
        ) : (
          <AzureConfigForm
            projectId={project.id}
            hasExistingConfig={Boolean(project.azureConfig)}
            initialValues={{
              organization: project.azureConfig?.organization ?? "",
              adoProject: project.azureConfig?.adoProject ?? "",
              assignedToEmail: project.azureConfig?.assignedToEmail ?? "",
            }}
          />
        )}
      </div>
    </AppShell>
  );
}
