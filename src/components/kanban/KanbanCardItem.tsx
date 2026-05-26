"use client";

import type { KanbanCard } from "@/lib/types";
import { PRIORITY_LABELS } from "@/lib/constants";
import { formatDate, cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLink, GripVertical } from "lucide-react";

type KanbanCardItemProps = {
  card: KanbanCard;
  onEdit?: (card: KanbanCard) => void;
};

export function KanbanCardItem({ card, onEdit }: KanbanCardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: "card",
      card,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        "min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition",
        isDragging && "opacity-60 shadow-lg",
      )}
    >
      <div className="mb-3 flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 shrink-0 cursor-grab text-slate-400 hover:text-slate-600 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onEdit?.(card)}
            className="block w-full text-left text-sm font-semibold text-slate-900 hover:text-blue-700 break-words line-clamp-3"
          >
            {card.title}
          </button>
          {card.description ? (
            <p className="mt-1 line-clamp-2 break-words text-xs text-slate-500">
              {card.description.replace(/<[^>]+>/g, "")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
        {card.source === "azure" ? (
          <>
            <span className="max-w-full truncate rounded-full bg-sky-100 px-2 py-0.5 font-medium text-sky-800">
              {card.workItemType}
            </span>
            {card.azureState ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                {card.azureState}
              </span>
            ) : null}
            {card.externalUrl ? (
              <a
                href={card.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sky-700 hover:underline"
              >
                #{card.externalId}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          </>
        ) : (
          <>
            {card.priority ? (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 font-medium text-violet-800">
                {PRIORITY_LABELS[card.priority as keyof typeof PRIORITY_LABELS]}
              </span>
            ) : null}
            {card.dueDate ? (
              <span className="text-slate-500">{formatDate(card.dueDate)}</span>
            ) : null}
          </>
        )}
      </div>
    </article>
  );
}
