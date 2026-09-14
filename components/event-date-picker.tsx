"use client";

import { DatePicker } from "@/components/date-picker";
import {
  formatEventScheduleLabel,
  getNextBookableLocalDate,
  isBookableLocalDate,
  type EventScheduleFields,
} from "@/lib/events/schedule";

export function EventBookingDatePicker({
  event,
  value,
  onChange,
  id,
}: {
  event: EventScheduleFields;
  value?: Date;
  onChange: (next: Date | undefined) => void;
  id?: string;
}) {
  const nextBookable = getNextBookableLocalDate(event);
  const defaultMonth =
    value ?? nextBookable ?? (event.starts_at ? new Date(event.starts_at) : undefined);

  return (
    <div className="grid gap-2">
      <DatePicker
        id={id}
        value={value}
        onChange={onChange}
        placeholder="Pick a day"
        defaultMonth={defaultMonth}
        disabled={!nextBookable}
        isDateDisabled={(date) => !isBookableLocalDate(event, date)}
      />
      <p className="text-xs text-muted-foreground">
        {nextBookable
          ? `${formatEventScheduleLabel(event)}. Choose the day you want to attend.`
          : "There are no upcoming dates available to book."}
      </p>
    </div>
  );
}
