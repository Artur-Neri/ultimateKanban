"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { KanbanCard } from "@/lib/types";
import {
  formatIsoDateToBr,
  maskBrDateInput,
  parseBrDateToIso,
} from "@/lib/utils";

type TaskFormModalProps = {
  projectId: string;
  columns: Array<{ id: string; name: string }>;
  task?: KanbanCard | null;
  onClose: () => void;
};

export function TaskFormModal({
  projectId,
  columns,
  task,
  onClose,
}: TaskFormModalProps) {
  const router = useRouter();
  const isEditing = Boolean(task && task.source === "manual");
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [columnId, setColumnId] = useState(
    task?.columnId ?? columns[0]?.id ?? "",
  );
  const [priority, setPriority] = useState(task?.priority ?? "MEDIUM");
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? formatIsoDateToBr(task.dueDate) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let parsedDueDate: string | null = null;
      if (dueDate.trim()) {
        const isoDueDate = parseBrDateToIso(dueDate);
        if (!isoDueDate) {
          throw new Error("Data inválida. Use o formato dd/mm/aaaa.");
        }
        parsedDueDate = new Date(`${isoDueDate}T12:00:00`).toISOString();
      }

      const payload = {
        title,
        description,
        columnId,
        priority,
        dueDate: parsedDueDate,
      };

      const response = await fetch(
        isEditing ? `/api/tasks/${task!.id}` : `/api/projects/${projectId}/tasks`,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const result = (await response.json()) as {
        error?: string;
        calendarSyncWarning?: string;
      };
      if (!response.ok) {
        throw new Error(result.error ?? "Erro ao salvar tarefa.");
      }

      if (result.calendarSyncWarning) {
        alert(
          `Tarefa salva, mas a sincronização com o Google Calendar falhou: ${result.calendarSyncWarning}`,
        );
      }

      onClose();
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Erro ao salvar tarefa.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!task || !confirm("Deseja excluir esta tarefa?")) {
      return;
    }

    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[min(92dvh,100%)] w-full max-w-lg space-y-4 overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEditing ? "Editar tarefa" : "Nova tarefa"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            Fechar
          </button>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Título</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Descrição</span>
          <textarea
            value={description ?? ""}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Coluna</span>
            <select
              value={columnId}
              onChange={(event) => setColumnId(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              {columns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Prioridade</span>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
            </select>
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Data limite</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="dd/mm/aaaa"
            maxLength={10}
            value={dueDate}
            onChange={(event) => setDueDate(maskBrDateInput(event.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </label>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          {isEditing ? (
            <button
              type="button"
              onClick={handleDelete}
              className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 sm:w-auto"
            >
              Excluir
            </button>
          ) : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 sm:ml-auto sm:w-auto"
          >
            {isSubmitting ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
