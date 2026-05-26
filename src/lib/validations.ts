import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(120),
  description: z.string().max(500).optional(),
  type: z.enum(["MANUAL", "AZURE_DEVOPS"]),
});

export const updateProjectSchema = createProjectSchema.partial();

export const createTaskSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(200),
  description: z.string().max(2000).optional(),
  columnId: z.string().min(1),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  dueDate: z.string().datetime().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const moveCardSchema = z.object({
  cardId: z.string().min(1),
  source: z.enum(["manual", "azure"]),
  targetColumnId: z.string().min(1),
  order: z.number().int().min(0).optional(),
});

export const azureConfigSchema = z.object({
  organization: z.string().min(1, "Organização é obrigatória"),
  adoProject: z.string().min(1, "Projeto Azure é obrigatório"),
  assignedToEmail: z.string().email("E-mail inválido"),
  pat: z.string().min(1, "PAT é obrigatório").optional(),
});

export const azureTestSchema = z.object({
  organization: z.string().min(1),
  adoProject: z.string().min(1),
  assignedToEmail: z.string().email(),
  pat: z.string().min(1),
});

export const googleCalendarConfigSchema = z.object({
  calendarId: z.string().min(1, "Selecione uma agenda."),
  calendarSummary: z.string().max(200).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type MoveCardInput = z.infer<typeof moveCardSchema>;
export type AzureConfigInput = z.infer<typeof azureConfigSchema>;
export type GoogleCalendarConfigInput = z.infer<
  typeof googleCalendarConfigSchema
>;
