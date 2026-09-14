export const CAFE_TIME_ZONE = "America/Toronto";

export const WEEKDAY_SHORT = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export const WEEKDAY_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface EventScheduleFields {
  starts_at: string | null;
  ends_at?: string | null;
  is_recurring?: boolean | null;
  recurrence_weekdays?: number[] | null;
  recurrence_until?: string | null;
}

const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isDateKey(value: string): boolean {
  if (!DATE_KEY_RE.test(value)) return false;
  const [year, month, day] = value.split("-").map((part) => Number.parseInt(part, 10));
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
}

export function toDateKeyLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKeyToLocalDate(dateKey: string): Date | null {
  if (!isDateKey(dateKey)) return null;
  const [year, month, day] = dateKey.split("-").map((part) => Number.parseInt(part, 10));
  const next = new Date(year, month - 1, day);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function weekdayOfDateKey(dateKey: string): Weekday | null {
  if (!isDateKey(dateKey)) return null;
  const [year, month, day] = dateKey.split("-").map((part) => Number.parseInt(part, 10));
  const weekday = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getUTCDay();
  return weekday as Weekday;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function zonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value])
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

export function formatDateKeyInTimeZone(
  date: Date,
  timeZone: string = CAFE_TIME_ZONE
): string {
  const parts = zonedParts(date, timeZone);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

export function getRecurrenceWeekdays(event: EventScheduleFields): Weekday[] {
  const stored = (event.recurrence_weekdays ?? []).filter(
    (day): day is Weekday =>
      Number.isInteger(day) && day >= 0 && day <= 6
  );
  if (stored.length > 0) {
    return [...new Set(stored)].sort((a, b) => a - b);
  }
  if (!event.starts_at) return [];
  const startKey = formatDateKeyInTimeZone(new Date(event.starts_at));
  const weekday = weekdayOfDateKey(startKey);
  return weekday === null ? [] : [weekday];
}

export function isRecurringEvent(event: EventScheduleFields): boolean {
  return Boolean(event.is_recurring);
}

export function getSeriesStartDateKey(event: EventScheduleFields): string | null {
  if (!event.starts_at) return null;
  return formatDateKeyInTimeZone(new Date(event.starts_at));
}

export function getSeriesUntilDateKey(event: EventScheduleFields): string | null {
  if (!event.recurrence_until) return null;
  const raw = event.recurrence_until.slice(0, 10);
  return isDateKey(raw) ? raw : null;
}

export function isBookableDateKey(
  event: EventScheduleFields,
  dateKey: string,
  todayKey: string = formatDateKeyInTimeZone(new Date())
): boolean {
  if (!isDateKey(dateKey) || !event.starts_at) return false;
  if (dateKey < todayKey) return false;

  const startKey = getSeriesStartDateKey(event);
  if (!startKey || dateKey < startKey) return false;

  const untilKey = getSeriesUntilDateKey(event);
  if (untilKey && dateKey > untilKey) return false;

  if (!isRecurringEvent(event)) {
    return dateKey === startKey;
  }

  const weekday = weekdayOfDateKey(dateKey);
  if (weekday === null) return false;
  return getRecurrenceWeekdays(event).includes(weekday);
}

export function isBookableLocalDate(
  event: EventScheduleFields,
  date: Date,
  now: Date = new Date()
): boolean {
  return isBookableDateKey(event, toDateKeyLocal(date), toDateKeyLocal(now));
}

export function getNextBookableLocalDate(
  event: EventScheduleFields,
  now: Date = new Date()
): Date | null {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  for (let offset = 0; offset < 366; offset += 1) {
    const candidate = new Date(today);
    candidate.setDate(today.getDate() + offset);
    if (isBookableLocalDate(event, candidate, now)) return candidate;
  }
  return null;
}

function formatWeekdayList(days: Weekday[]): string {
  const unique = [...new Set(days)].sort((a, b) => a - b);
  if (unique.length === 0) return "Recurring";
  if (unique.length === 7) return "Every day";
  const names = unique.map((day) => WEEKDAY_LONG[day]);
  if (names.length === 1) return `Every ${names[0]}`;
  if (names.length === 2) return `Every ${names[0]} & ${names[1]}`;
  return `Every ${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

function formatClock(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleTimeString("en-US", {
      timeZone: CAFE_TIME_ZONE,
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

function formatTimeRange(event: EventScheduleFields): string | null {
  const start = formatClock(event.starts_at);
  if (!start) return null;
  const end = formatClock(event.ends_at ?? null);
  return end ? `${start} – ${end}` : start;
}

export function formatDateKeyLabel(dateKey: string): string {
  if (!isDateKey(dateKey)) return dateKey;
  const utcNoon = new Date(`${dateKey}T12:00:00.000Z`);
  return utcNoon.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatEventScheduleLabel(event: EventScheduleFields): string {
  const timeRange = formatTimeRange(event);
  if (!event.starts_at) return "Date/time TBD";

  if (isRecurringEvent(event)) {
    const days = formatWeekdayList(getRecurrenceWeekdays(event));
    const untilKey = getSeriesUntilDateKey(event);
    const until = untilKey
      ? ` until ${formatDateKeyLabel(untilKey)}`
      : "";
    return timeRange ? `${days}${until} • ${timeRange}` : `${days}${until}`;
  }

  const startKey = formatDateKeyInTimeZone(new Date(event.starts_at));
  const dateLabel = formatDateKeyLabel(startKey);
  return timeRange ? `${dateLabel} • ${timeRange}` : dateLabel;
}

export function formatOccurrenceLabel(
  event: EventScheduleFields,
  dateKey: string
): string {
  const dateLabel = formatDateKeyLabel(dateKey);
  const timeRange = formatTimeRange(event);
  return timeRange ? `${dateLabel} • ${timeRange}` : dateLabel;
}

export function bookableDateError(event: EventScheduleFields, dateKey: string): string | null {
  if (!isDateKey(dateKey)) return "Please choose a valid date.";
  if (!event.starts_at) return "This event does not have a schedule yet.";
  if (isBookableDateKey(event, dateKey)) return null;
  if (isRecurringEvent(event)) {
    return "That day is not available for this event. Please pick a matching weekday.";
  }
  return "Please book the scheduled date for this event.";
}
