"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectType } from "@prisma/client";

type ProjectFormProps = {
  mode?: "create";
};

export function ProjectForm({ mode = "create" }: ProjectFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ProjectType>("MANUAL");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, type }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Erro ao criar projeto.");
      }

      const project = (await response.json()) as { id: string; type: ProjectType };
      router.push(
        project.type === "AZURE_DEVOPS"
          ? `/projects/${project.id}/settings`
          : `/projects/${project.id}`,
      );
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Erro ao criar projeto.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-2xl space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8"
    >
      <div>
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
          {mode === "create" ? "Novo projeto" : "Editar projeto"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Crie um quadro manual ou vincule um projeto do Azure DevOps.
        </p>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Nome</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          placeholder="Ex: Sysemp"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Descrição</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          placeholder="Opcional"
        />
      </label>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-slate-700">Tipo</legend>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 hover:border-blue-300">
          <input
            type="radio"
            name="type"
            value="MANUAL"
            checked={type === "MANUAL"}
            onChange={() => setType("MANUAL")}
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-semibold text-slate-900">
              Manual
            </span>
            <span className="block text-sm text-slate-500">
              Crie e gerencie tarefas localmente, ideal para freelance.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 hover:border-blue-300">
          <input
            type="radio"
            name="type"
            value="AZURE_DEVOPS"
            checked={type === "AZURE_DEVOPS"}
            onChange={() => setType("AZURE_DEVOPS")}
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-semibold text-slate-900">
              Azure DevOps
            </span>
            <span className="block text-sm text-slate-500">
              Sincronize work items atribuídos a você a partir do Azure DevOps.
            </span>
          </span>
        </label>
      </fieldset>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {isSubmitting ? "Salvando..." : "Criar projeto"}
      </button>
    </form>
  );
}
