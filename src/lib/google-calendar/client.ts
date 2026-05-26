import type { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

export type GoogleCalendarListItem = {
  id: string;
  summary: string;
  primary?: boolean;
};

export type CalendarEventInput = {
  title: string;
  description?: string | null;
  dueDate: Date;
};

function getCalendarApi(auth: OAuth2Client) {
  return google.calendar({ version: "v3", auth });
}

export async function listCalendars(
  auth: OAuth2Client,
): Promise<GoogleCalendarListItem[]> {
  const calendar = getCalendarApi(auth);
  const response = await calendar.calendarList.list({ maxResults: 250 });

  const items = response.data.items ?? [];

  return items
    .filter((item) => Boolean(item.id))
    .map((item) => ({
      id: item.id!,
      summary: item.summary ?? item.id!,
      primary: item.primary ?? false,
    }));
}

export async function createCalendar(
  auth: OAuth2Client,
  summary: string,
): Promise<GoogleCalendarListItem> {
  const calendar = getCalendarApi(auth);
  const response = await calendar.calendars.insert({
    requestBody: { summary },
  });

  if (!response.data.id) {
    throw new Error("Falha ao criar agenda no Google Calendar.");
  }

  return {
    id: response.data.id,
    summary: response.data.summary ?? summary,
  };
}

function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addOneDay(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  date.setDate(date.getDate() + 1);
  return formatDateOnly(date);
}

function buildEventBody(input: CalendarEventInput) {
  const startDate = formatDateOnly(input.dueDate);
  return {
    summary: input.title,
    description: input.description ?? undefined,
    start: { date: startDate },
    end: { date: addOneDay(startDate) },
  };
}

export async function insertEvent(
  auth: OAuth2Client,
  calendarId: string,
  input: CalendarEventInput,
): Promise<string> {
  const calendar = getCalendarApi(auth);
  const response = await calendar.events.insert({
    calendarId,
    requestBody: buildEventBody(input),
  });

  if (!response.data.id) {
    throw new Error("Falha ao criar evento no Google Calendar.");
  }

  return response.data.id;
}

export async function updateEvent(
  auth: OAuth2Client,
  calendarId: string,
  eventId: string,
  input: CalendarEventInput,
): Promise<void> {
  const calendar = getCalendarApi(auth);
  await calendar.events.update({
    calendarId,
    eventId,
    requestBody: buildEventBody(input),
  });
}

export async function deleteEvent(
  auth: OAuth2Client,
  calendarId: string,
  eventId: string,
): Promise<void> {
  const calendar = getCalendarApi(auth);
  await calendar.events.delete({ calendarId, eventId });
}
