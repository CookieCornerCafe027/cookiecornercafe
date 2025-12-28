"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, X } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface DateTimePickerProps {
  value: Date | null;
  onChange: (next: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  /**
   * If provided, the date portion is locked to this day (time can still change).
   * Useful for "end time on same day as start".
   */
  fixedDate?: Date | null;
  /**
   * Minutes between selectable times. Default: 30.
   * (Matches checkout)
   */
  stepMinutes?: number;
  /**
   * If true, disallow selecting past dates (date-only check, like checkout).
   */
  disablePastDates?: boolean;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toHHMM(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function fromDateAndHHMM(date: Date, hhmm: string) {
  const [hh, mm] = hhmm.split(":").map((x) => Number.parseInt(x, 10));
  const next = new Date(date);
  next.setHours(hh || 0, mm || 0, 0, 0);
  return next;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date & time",
  disabled = false,
  allowClear = false,
  fixedDate = null,
  stepMinutes = 30,
  disablePastDates = false,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value ?? undefined);
  const [selectedTime, setSelectedTime] = useState<string>(value ? toHHMM(value) : "");

  useEffect(() => {
    setSelectedDate(value ?? undefined);
    setSelectedTime(value ? toHHMM(value) : "");
  }, [value]);

  useEffect(() => {
    if (fixedDate) {
      // Ensure time selection is enabled even when value is null.
      setSelectedDate(new Date(fixedDate));
    }
  }, [fixedDate]);

  const timeOptions = useMemo(() => {
    const STEP = Math.max(1, stepMinutes);
    const slots: Array<{ value: string; label: string }> = [];
    for (let m = 0; m < 24 * 60; m += STEP) {
      const d = new Date();
      d.setHours(Math.floor(m / 60), m % 60, 0, 0);
      const v = `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
      slots.push({ value: v, label: format(d, "h:mm a") });
    }
    return slots;
  }, [stepMinutes]);

  const display = value ? format(value, "PPP p") : "";
  const effectiveDate = fixedDate ?? selectedDate;
  const effectiveDisplayDate = fixedDate ? format(fixedDate, "PPP") : display ? format(value!, "PPP") : "";

  const commit = (date?: Date, time?: string) => {
    if (!date || !time) {
      onChange(null);
      return;
    }
    onChange(fromDateAndHHMM(date, time));
  };

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {fixedDate ? (
        <Button
          type="button"
          variant="outline"
          disabled
          className={cn("w-full justify-start text-left font-normal", "text-muted-foreground")}
          title="End date is locked to the start date"
        >
          <CalendarIcon className="mr-2 size-4 opacity-70" />
          {effectiveDisplayDate}
        </Button>
      ) : (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 size-4 opacity-70" />
              {display ? format(value!, "PPP") : placeholder}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                const d = date ?? undefined;
                setSelectedDate(d);
                // keep selectedTime if already chosen, otherwise default to noon.
                const nextTime = selectedTime || (value ? toHHMM(value) : "12:00");
                if (d) {
                  setSelectedTime(nextTime);
                  commit(d, nextTime);
                } else {
                  setSelectedTime("");
                  onChange(null);
                }
              }}
              disabled={
                disablePastDates
                  ? (date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const d = new Date(date);
                      d.setHours(0, 0, 0, 0);
                      return d < today;
                    }
                  : undefined
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )}

      <div className="flex gap-2">
        <Select
          value={selectedTime}
          onValueChange={(t) => {
            setSelectedTime(t);
            if (effectiveDate) {
              commit(effectiveDate, t);
            }
          }}
          disabled={disabled || !effectiveDate}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={!effectiveDate ? "Choose a date first" : "Select a time"} />
          </SelectTrigger>
          <SelectContent>
            {timeOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                <span className="inline-flex items-center gap-2">
                  <Clock className="size-4 opacity-70" />
                  {o.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {allowClear ? (
          <Button
            type="button"
            variant="outline"
            disabled={disabled || !value}
            onClick={() => {
              setSelectedTime("");
              if (fixedDate) setSelectedDate(new Date(fixedDate));
              onChange(null);
            }}
            aria-label="Clear date and time"
            title="Clear"
            className="shrink-0"
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

