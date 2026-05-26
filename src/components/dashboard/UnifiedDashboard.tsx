"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { DashboardProjectGroup } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { PRIORITY_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { ExternalLink, Search } from "lucide-react";

type UnifiedDashboardProps = {
  groups: DashboardProjectGroup[];
};

export function UnifiedDashboard({ groups }: UnifiedDashboardProps) {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "manual" | "azure">(
    "all",
  );

  const filteredGroups = useMemo(() => {
    return groups
      .map((group) => ({
        ...group,
        cards: group.cards.filter((card) => {
          const matchesSearch =
            search.trim().length === 0 ||
            card.title.toLowerCase().includes(search.toLowerCase());
          const matchesSource =
            sourceFilter === "all" || card.source === sourceFilter;
          return matchesSearch && matchesSource;
        }),
      }))
      .filter((group) => group.cards.length > 0);
  }, [groups, search, sourceFilter]);

  const totalCards = groups.reduce((sum, group) => sum + group.totalCount, 0);
  const openCards = groups.reduce((sum, group) => sum + group.openCount, 0);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Projetos</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {groups.length}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Demandas totais</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {totalCards}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Em aberto</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {openCards}
          </p>
        </article>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar demandas..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={sourceFilter}
          onChange={(event) =>
            setSourceFilter(event.target.value as "all" | "manual" | "azure")
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">Todas as origens</option>
          <option value="manual">Somente manuais</option>
          <option value="azure">Somente Azure DevOps</option>
        </select>
      </section>

      {filteredGroups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-lg font-medium text-slate-900">
            Nenhuma demanda encontrada
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Crie um projeto manual ou configure a integração com Azure DevOps.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map((group) => (
            <section
              key={group.project.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {group.project.name}
                  </h2>
                  <Badge
                    variant={
                      group.project.type === "AZURE_DEVOPS" ? "azure" : "manual"
                    }
                  >
                    {group.project.type === "AZURE_DEVOPS"
                      ? "Azure DevOps"
                      : "Manual"}
                  </Badge>
                  <span className="text-sm text-slate-500">
                    {group.cards.length} demandas
                  </span>
                </div>
                <Link
                  href={`/projects/${group.project.id}`}
                  className="text-sm font-medium text-blue-700 hover:underline"
                >
                  Abrir quadro
                </Link>
              </div>

              <div className="grid gap-3">
                {group.cards.map((card) => (
                  <article
                    key={card.id}
                    className="rounded-xl border border-slate-200 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{card.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          {card.source === "azure" ? (
                            <>
                              <span>{card.workItemType}</span>
                              <span>{card.azureState}</span>
                            </>
                          ) : (
                            <>
                              {card.priority ? (
                                <span>
                                  {
                                    PRIORITY_LABELS[
                                      card.priority as keyof typeof PRIORITY_LABELS
                                    ]
                                  }
                                </span>
                              ) : null}
                              {card.dueDate ? (
                                <span>{formatDate(card.dueDate)}</span>
                              ) : null}
                            </>
                          )}
                        </div>
                      </div>
                      {card.externalUrl ? (
                        <a
                          href={card.externalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-sky-700 hover:underline"
                        >
                          Abrir no Azure
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
