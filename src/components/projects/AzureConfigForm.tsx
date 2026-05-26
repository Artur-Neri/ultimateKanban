"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AzureConfigFormProps = {
  projectId: string;
  initialValues: {
    organization: string;
    adoProject: string;
    assignedToEmail: string;
  };
  hasExistingConfig: boolean;
};

export function AzureConfigForm({
  projectId,
  initialValues,
  hasExistingConfig,
}: AzureConfigFormProps) {
  const router = useRouter();
  const [organization, setOrganization] = useState(initialValues.organization);
  const [adoProject, setAdoProject] = useState(initialValues.adoProject);
  const [assignedToEmail, setAssignedToEmail] = useState(
    initialValues.assignedToEmail,
  );
  const [pat, setPat] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  async function handleTestConnection() {
    setIsTesting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/azure-config/test`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organization,
            adoProject,
            assignedToEmail,
            pat: pat || undefined,
          }),
        },
      );

      const payload = (await response.json()) as {
        error?: string;
        workItemCount?: number;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Falha ao testar conexão.");
      }

      setMessage(
        `Conexão OK. ${payload.workItemCount ?? 0} work items encontrados para ${assignedToEmail}.`,
      );
    } catch (testError) {
      setError(
        testError instanceof Error
          ? testError.message
          : "Erro ao testar conexão.",
      );
    } finally {
      setIsTesting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/azure-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization,
          adoProject,
          assignedToEmail,
          pat: pat || undefined,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Erro ao salvar configuração.");
      }

      setMessage("Configuração salva com sucesso.");
      setPat("");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Erro ao salvar configuração.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
    >
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Integração Azure DevOps
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Informe a organização, projeto e PAT. O token é criptografado antes de
          ser salvo no banco.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Organização</span>
          <input
            value={organization}
            onChange={(event) => setOrganization(event.target.value)}
            required
            placeholder="minha-org"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">
            Projeto Azure
          </span>
          <input
            value={adoProject}
            onChange={(event) => setAdoProject(event.target.value)}
            required
            placeholder="Sysemp"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">
          E-mail atribuído no Azure DevOps
        </span>
        <input
          type="email"
          value={assignedToEmail}
          onChange={(event) => setAssignedToEmail(event.target.value)}
          required
          placeholder="voce@empresa.com"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">
          Personal Access Token (PAT)
        </span>
        <input
          type="password"
          value={pat}
          onChange={(event) => setPat(event.target.value)}
          required={!hasExistingConfig}
          placeholder={
            hasExistingConfig
              ? "Deixe em branco para manter o PAT atual"
              : "Informe o PAT com escopo Work Items"
          }
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
      </label>

      {message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleTestConnection}
          disabled={isTesting}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {isTesting ? "Testando..." : "Testar conexão"}
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isSaving ? "Salvando..." : "Salvar configuração"}
        </button>
      </div>
    </form>
  );
}
