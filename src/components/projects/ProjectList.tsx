"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Settings2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ProjectListItem = {
  id: string;
  name: string;
  description?: string | null;
  type: "MANUAL" | "AZURE_DEVOPS";
  _count?: { tasks: number };
  azureConfig?: {
    organization: string;
    adoProject: string;
    assignedToEmail: string;
  } | null;
};

type ProjectListProps = {
  projects: ProjectListItem[];
};

export function ProjectList({ projects }: ProjectListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(projectId: string) {
    if (!confirm("Deseja excluir este projeto?")) {
      return;
    }

    setDeletingId(projectId);
    try {
      await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-lg font-medium text-slate-900">
          Nenhum projeto criado ainda
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Comece criando um projeto manual ou integrado ao Azure DevOps.
        </p>
        <Link
          href="/projects/new"
          className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Criar primeiro projeto
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {projects.map((project) => (
        <article
          key={project.id}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">
                  {project.name}
                </h2>
                <Badge variant={project.type === "AZURE_DEVOPS" ? "azure" : "manual"}>
                  {project.type === "AZURE_DEVOPS" ? "Azure DevOps" : "Manual"}
                </Badge>
              </div>
              {project.description ? (
                <p className="mt-2 text-sm text-slate-500">{project.description}</p>
              ) : null}
              {project.type === "MANUAL" ? (
                <p className="mt-3 text-xs text-slate-500">
                  {project._count?.tasks ?? 0} tarefas locais
                </p>
              ) : project.azureConfig ? (
                <p className="mt-3 text-xs text-slate-500">
                  {project.azureConfig.organization}/{project.azureConfig.adoProject}
                </p>
              ) : (
                <p className="mt-3 text-xs text-amber-700">
                  Integração Azure pendente
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Link
                href={`/projects/${project.id}/settings`}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                title={
                  project.type === "AZURE_DEVOPS"
                    ? "Configuração Azure"
                    : "Configuração Google Calendar"
                }
              >
                <Settings2 className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(project.id)}
                disabled={deletingId === project.id}
                className="rounded-lg border border-slate-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <Link
            href={`/projects/${project.id}`}
            className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Abrir quadro
          </Link>
        </article>
      ))}
    </div>
  );
}
