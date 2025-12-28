"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export interface EventCheckoutFormProps {
  event: {
    id: string;
    title: string;
    price_per_entry: number;
  };
  initialQuantity?: number;
}

export function EventCheckoutForm({ event, initialQuantity = 1 }: EventCheckoutFormProps) {
  const { toast } = useToast();
  const [ticketQty, setTicketQty] = useState<number>(initialQuantity || 1);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = useMemo(() => event.price_per_entry * ticketQty, [event.price_per_entry, ticketQty]);

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

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/stripe/event-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          quantity: ticketQty,
          customerName,
          customerEmail,
          customerPhone,
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
          <p className="text-sm text-muted-foreground">
            ${event.price_per_entry.toFixed(2)} per entry
          </p>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ticketQtyCheckout">Tickets</Label>
            <Input
              id="ticketQtyCheckout"
              type="number"
              inputMode="numeric"
              min={1}
              max={99}
              value={ticketQty}
              onChange={(e) => setTicketQty(Number(e.target.value))}
            />
            <p className="text-sm text-muted-foreground">
              Total:{" "}
              <span className="font-semibold text-foreground">
                ${total.toFixed(2)}
              </span>
            </p>
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
          <Button size="lg" className="w-full" onClick={startCheckout} disabled={isSubmitting}>
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

