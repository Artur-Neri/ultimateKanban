"use client";

import type { KanbanCard, KanbanColumnView } from "@/lib/types";
import { KanbanCardItem } from "@/components/kanban/KanbanCardItem";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";

type KanbanColumnProps = {
  column: KanbanColumnView;
  onEditCard?: (card: KanbanCard) => void;
};

export function KanbanColumn({ column, onEditCard }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "column",
      columnId: column.id,
    },
  });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-[520px] w-80 shrink-0 flex-col rounded-2xl border border-slate-200 bg-slate-100/70 p-4",
        isOver && "border-blue-400 bg-blue-50/60",
      )}
    >
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{column.name}</h3>
          <p className="text-xs text-slate-500">{column.cards.length} itens</p>
        </div>
        {column.isDone ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
            Concluído
          </span>
        ) : null}
      </header>

      <SortableContext
        items={column.cards.map((card) => card.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-3">
          {column.cards.map((card) => (
            <KanbanCardItem key={card.id} card={card} onEdit={onEditCard} />
          ))}
        </div>
      </SortableContext>
    </section>
  );
}
