"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type GoogleCalendarConfigFormProps = {
  projectId: string;
  projectName: string;
};

type GoogleConfigStatus = {
  connected: boolean;
  accountEmail: string | null;
  calendarId: string | null;
  calendarSummary: string | null;
};

type CalendarOption = {
  id: string;
  summary: string;
  primary?: boolean;
};

export function GoogleCalendarConfigForm({
  projectId,
  projectName,
}: GoogleCalendarConfigFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<GoogleConfigStatus | null>(null);
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingCalendar, setIsCreatingCalendar] = useState(false);

  const loadStatus = useCallback(async () => {
    const response = await fetch(`/api/projects/${projectId}/google-config`, {
      cache: "no-store",
    });
    const payload = (await response.json()) as GoogleConfigStatus & {
      error?: string;
    };

    if (!response.ok) {
      throw new Error(payload.error ?? "Erro ao carregar configuração.");
    }

    setStatus(payload);
    setSelectedCalendarId(payload.calendarId ?? "");
    return payload;
  }, [projectId]);

  const loadCalendars = useCallback(async () => {
    const response = await fetch(`/api/projects/${projectId}/google-calendars`, {
      cache: "no-store",
    });
    const payload = (await response.json()) as CalendarOption[] & {
      error?: string;
    };

    if (!response.ok) {
      throw new Error(payload.error ?? "Erro ao listar agendas.");
    }

    setCalendars(payload);
  }, [projectId]);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      setError(null);
      setCalendarError(null);

      if (searchParams.get("google_connected") === "1") {
        setMessage("Conta Google conectada. Escolha ou crie uma agenda abaixo.");
      }

      try {
        const config = await loadStatus();
        if (config.connected) {
          try {
            await loadCalendars();
          } catch (calendarsError) {
            setCalendarError(
              calendarsError instanceof Error
                ? calendarsError.message
                : "Erro ao listar agendas do Google.",
            );
          }
        }
      } catch (initError) {
        setError(
          initError instanceof Error
            ? initError.message
            : "Erro ao carregar configuração.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void init();
  }, [loadStatus, loadCalendars, searchParams]);

  function handleConnectGoogle() {
    window.location.href = `/api/google/auth?projectId=${encodeURIComponent(projectId)}`;
  }

  const needsCalendarScope =
    calendarError?.toLowerCase().includes("insufficient authentication scopes") ??
    false;

  async function handleReconnectGoogle() {
    setError(null);
    setCalendarError(null);

    try {
      await fetch("/api/google/integration", { method: "DELETE" });
    } catch {
      // segue para OAuth mesmo se falhar limpar localmente
    }

    handleConnectGoogle();
  }

  async function handleSaveCalendar(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const selected = calendars.find((c) => c.id === selectedCalendarId);
      const response = await fetch(`/api/projects/${projectId}/google-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calendarId: selectedCalendarId,
          calendarSummary: selected?.summary,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Erro ao salvar agenda.");
      }

      setMessage("Agenda vinculada com sucesso.");
      await loadStatus();
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Erro ao salvar agenda.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateProjectCalendar() {
    setIsCreatingCalendar(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/google-config/calendar`,
        { method: "POST" },
      );

      const payload = (await response.json()) as {
        error?: string;
        calendarId?: string;
        calendarSummary?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Erro ao criar agenda.");
      }

      setMessage(`Agenda "${payload.calendarSummary}" criada e vinculada.`);
      await loadStatus();
      await loadCalendars();
      if (payload.calendarId) {
        setSelectedCalendarId(payload.calendarId);
      }
      router.refresh();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Erro ao criar agenda.",
      );
    } finally {
      setIsCreatingCalendar(false);
    }
  }

  async function handleUnlink() {
    if (!confirm("Desvincular a agenda deste projeto? As tarefas existentes não serão removidas do Google.")) {
      return;
    }

    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/google-config`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Erro ao desvincular.");
      }

      setMessage("Agenda desvinculada do projeto.");
      await loadStatus();
      router.refresh();
    } catch (unlinkError) {
      setError(
        unlinkError instanceof Error
          ? unlinkError.message
          : "Erro ao desvincular agenda.",
      );
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-slate-500">Carregando configuração...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Integração Google Calendar
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Tarefas com data limite neste projeto serão sincronizadas com a agenda
          escolhida (criar, atualizar e excluir eventos).
        </p>
      </div>

      <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <p>
          <span className="font-medium">Conta Google:</span>{" "}
          {status?.connected
            ? (status.accountEmail ?? "Conectada")
            : "Não conectada"}
        </p>
        {status?.calendarSummary ? (
          <p className="mt-1">
            <span className="font-medium">Agenda vinculada:</span>{" "}
            {status.calendarSummary}
          </p>
        ) : null}
      </div>

      {!status?.connected ? (
        <button
          type="button"
          onClick={handleConnectGoogle}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Conectar conta Google
        </button>
      ) : (
        <form onSubmit={handleSaveCalendar} className="space-y-4">
          {calendarError ? (
            <div className="space-y-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {needsCalendarScope ? (
                <>
                  <p>
                    A conta está conectada, mas <strong>sem permissão de
                    calendário</strong>. Isso costuma ocorrer após mudar os
                    escopos no Google Cloud.
                  </p>
                  <ol className="list-decimal space-y-1 pl-5">
                    <li>
                      Em{" "}
                      <a
                        href="https://myaccount.google.com/permissions"
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        permissões da conta Google
                      </a>
                      , remova o acesso do ultimateKanban.
                    </li>
                    <li>Clique em &quot;Reconectar com permissão de calendário&quot; abaixo.</li>
                  </ol>
                </>
              ) : (
                <p>{calendarError}</p>
              )}
              <div className="flex flex-wrap gap-3 pt-1">
                {needsCalendarScope ? (
                  <button
                    type="button"
                    onClick={handleReconnectGoogle}
                    className="rounded-lg bg-amber-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-900"
                  >
                    Reconectar com permissão de calendário
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setCalendarError(null);
                    void loadCalendars().catch((retryError) => {
                      setCalendarError(
                        retryError instanceof Error
                          ? retryError.message
                          : "Erro ao listar agendas.",
                      );
                    });
                  }}
                  className="font-medium underline"
                >
                  Tentar listar agendas novamente
                </button>
              </div>
            </div>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">
              Agenda do projeto
            </span>
            <select
              value={selectedCalendarId}
              onChange={(event) => setSelectedCalendarId(event.target.value)}
              required
              disabled={calendars.length === 0}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
            >
              <option value="">
                {calendars.length === 0
                  ? "Nenhuma agenda carregada"
                  : "Selecione uma agenda"}
              </option>
              {calendars.map((calendar) => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.summary}
                  {calendar.primary ? " (principal)" : ""}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSaving || !selectedCalendarId}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isSaving ? "Salvando..." : "Salvar agenda"}
            </button>
            <button
              type="button"
              onClick={handleCreateProjectCalendar}
              disabled={isCreatingCalendar}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {isCreatingCalendar
                ? "Criando..."
                : `Criar agenda "${projectName}"`}
            </button>
            {status.calendarId ? (
              <button
                type="button"
                onClick={handleUnlink}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Desvincular agenda
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleReconnectGoogle}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Trocar conta Google
            </button>
          </div>
        </form>
      )}

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
    </div>
  );
}
