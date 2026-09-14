"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  value?: Date;
  onChange: (next: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  isDateDisabled?: (date: Date) => boolean;
  allowClear?: boolean;
  defaultMonth?: Date;
  id?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  isDateDisabled,
  allowClear = false,
  defaultMonth,
  id,
}: DatePickerProps) {
  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 size-4 opacity-70" />
            {value ? format(value, "PPP") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            defaultMonth={value ?? defaultMonth}
            onSelect={(date) => onChange(date ?? undefined)}
            disabled={isDateDisabled}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {allowClear ? (
        <Button
          type="button"
          variant="outline"
          disabled={disabled || !value}
          onClick={() => onChange(undefined)}
          aria-label="Clear date"
          title="Clear"
          className="shrink-0"
        >
          <X className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
