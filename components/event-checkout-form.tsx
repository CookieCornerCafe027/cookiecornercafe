"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EventBookingDatePicker } from "@/components/event-date-picker";
import { useToast } from "@/hooks/use-toast";
import {
  formatOccurrenceLabel,
  getNextBookableLocalDate,
  isBookableLocalDate,
  parseDateKeyToLocalDate,
  toDateKeyLocal,
  type EventScheduleFields,
} from "@/lib/events/schedule";

export interface EventCheckoutFormProps {
  event: {
    id: string;
    title: string;
    price_per_entry: number;
    pricing_options?: { label: string; price: number }[];
  } & EventScheduleFields;
  initialQuantity?: number;
  initialDate?: string;
}

export function EventCheckoutForm({
  event,
  initialQuantity = 1,
  initialDate,
}: EventCheckoutFormProps) {
  const { toast } = useToast();
  const [ticketQty, setTicketQty] = useState<number>(initialQuantity || 1);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    const fromQuery = initialDate ? parseDateKeyToLocalDate(initialDate) : null;
    if (fromQuery && isBookableLocalDate(event, fromQuery)) return fromQuery;
    return getNextBookableLocalDate(event) ?? undefined;
  });
const pricingOptions = event.pricing_options ?? [];
const [selectedPricingIndex, setSelectedPricingIndex] = useState(0);
  const selectedPrice = pricingOptions[selectedPricingIndex]?.price ?? event.price_per_entry;
const total = useMemo(() => selectedPrice * ticketQty, [selectedPrice, ticketQty]);
  const bookedDateKey = selectedDate ? toDateKeyLocal(selectedDate) : null;

  const startCheckout = async () => {
    if (
      !customerName.trim() ||
      !customerEmail.trim() ||
      !customerPhone.trim()
    ) {
      toast({
        title: "Missing information",
        description: "Please enter your name, email, and phone number.",
        variant: "destructive",
      });
      return;
    }
    if (!Number.isFinite(ticketQty) || ticketQty < 1 || ticketQty > 99) {
      toast({
        title: "Invalid ticket quantity",
        description: "Please choose between 1 and 99 tickets.",
        variant: "destructive",
      });
      return;
    }
    if (!bookedDateKey) {
      toast({
        title: "Pick a day",
        description: "Please choose the day you want to book.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/stripe/event-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          quantity: 1,
          pricingIndex: selectedPricingIndex,
          customerName,
          customerEmail,
          customerPhone,
          bookedDate: bookedDateKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.error || `Failed to start checkout (${res.status})`
        );
      }
      if (!data?.url) {
        throw new Error("Missing Stripe redirect URL");
      }

      window.location.assign(data.url);
    } catch (err: any) {
      console.error("Error creating event checkout:", err);
      toast({
        title: "Checkout failed",
        description: (
          err?.message ?? "Failed to start Stripe checkout. Please try again."
        )
          .toString()
          .slice(0, 300),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-display font-bold">{event.title}</h1>
         {pricingOptions.length > 0 ? (
  <div className="grid gap-2">
    <Label>Ticket type</Label>
    <select
      value={selectedPricingIndex}
      onChange={(e) => setSelectedPricingIndex(Number(e.target.value))}
      className="w-full rounded-md border p-2"
    >
      {pricingOptions.map((option, index) => (
        <option key={index} value={index}>
          {option.label}: ${option.price.toFixed(2)}
        </option>
      ))}
    </select>
  </div>
) : (
  <p className="text-sm text-muted-foreground">
    ${event.price_per_entry.toFixed(2)} per entry
  </p>
)}
          {bookedDateKey ? (
            <p className="text-sm text-muted-foreground">
              {formatOccurrenceLabel(event, bookedDateKey)}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="eventDayCheckout">Day</Label>
            <EventBookingDatePicker
              id="eventDayCheckout"
              event={event}
              value={selectedDate}
              onChange={setSelectedDate}
            />
          </div>

          

          <div className="grid gap-2">
            <Label htmlFor="customerNameCheckout">Full Name</Label>
            <Input
              id="customerNameCheckout"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="customerEmailCheckout">Email</Label>
            <Input
              id="customerEmailCheckout"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="customerPhoneCheckout">Phone</Label>
            <Input
              id="customerPhoneCheckout"
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Button
            size="lg"
            className="w-full"
            onClick={startCheckout}
            disabled={isSubmitting || !bookedDateKey}
          >
            {isSubmitting ? "Redirecting..." : "Checkout"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            You’ll be redirected to Stripe to complete payment.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
