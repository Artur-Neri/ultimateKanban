export const MANUAL_DEFAULT_COLUMNS = [
  { name: "A fazer", order: 0, isDone: false },
  { name: "Em andamento", order: 1, isDone: false },
  { name: "Concluído", order: 2, isDone: true },
] as const;

export const AZURE_DEFAULT_COLUMNS = [
  { name: "New", order: 0, isDone: false, azureState: "New" },
  { name: "Active", order: 1, isDone: false, azureState: "Active" },
  { name: "Resolved", order: 2, isDone: false, azureState: "Resolved" },
  { name: "Closed", order: 3, isDone: true, azureState: "Closed" },
] as const;

export const PRIORITY_LABELS = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
} as const;
