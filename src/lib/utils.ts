import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

/** Converte ISO (yyyy-mm-dd ou datetime) para exibição dd/mm/aaaa. */
export function formatIsoDateToBr(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  if (!year || !month || !day) {
    return "";
  }
  return `${day}/${month}/${year}`;
}

/** Aplica máscara dd/mm/aaaa enquanto o usuário digita. */
export function maskBrDateInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Converte dd/mm/aaaa para ISO yyyy-mm-dd; retorna null se inválida. */
export function parseBrDateToIso(brDate: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(brDate.trim());
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
