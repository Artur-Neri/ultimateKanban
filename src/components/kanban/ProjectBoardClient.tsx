"use client";

import { useState } from "react";
import Link from "next/link";
import type { KanbanCard, ProjectBoardView } from "@/lib/types";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { TaskFormModal } from "@/components/kanban/TaskFormModal";
import { Badge } from "@/components/ui/Badge";
import { Plus, Settings2 } from "lucide-react";

type ProjectBoardClientProps = {
  board: ProjectBoardView;
};

export function ProjectBoardClient({ board }: ProjectBoardClientProps) {
  const [selectedTask, setSelectedTask] = useState<KanbanCard | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isManual = board.project.type === "MANUAL";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              {board.project.name}
            </h1>
            <Badge variant={isManual ? "manual" : "azure"}>
              {isManual ? "Manual" : "Azure DevOps"}
            </Badge>
          </div>
          {board.project.description ? (
            <p className="mt-2 text-sm text-slate-500">
              {board.project.description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          {!isManual ? (
            <Link
              href={`/projects/${board.project.id}/settings`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
            >
              <Settings2 className="h-4 w-4 shrink-0" />
              <span className="truncate">Configuração Azure</span>
            </Link>
          ) : (
            <>
              <Link
                href={`/projects/${board.project.id}/settings`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
              >
                <Settings2 className="h-4 w-4 shrink-0" />
                <span className="truncate">Google Calendar</span>
              </Link>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 shrink-0" />
                Nova tarefa
              </button>
            </>
          )}
        </div>
      </div>

      <KanbanBoard
        initialBoard={board}
        projectId={board.project.id}
        onEditCard={(card) => {
          if (card.source === "manual") {
            setSelectedTask(card);
          }
        }}
      />

      {showCreateModal ? (
        <TaskFormModal
          projectId={board.project.id}
          columns={board.columns.map((column) => ({
            id: column.id,
            name: column.name,
          }))}
          onClose={() => setShowCreateModal(false)}
        />
      ) : null}

      {selectedTask ? (
        <TaskFormModal
          projectId={board.project.id}
          columns={board.columns.map((column) => ({
            id: column.id,
            name: column.name,
          }))}
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      ) : null}
    </div>
  );
}
