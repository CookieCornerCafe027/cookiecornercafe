"use client";

import type React from "react";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { format, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CheckoutForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    deliveryType: "pickup",
    pickupDeliveryTime: "",
    deliveryAddress: "",
    notes: "",
  });
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");

  const PICKUP_ADDRESS = "100 Wingarden Court, Toronto ON, M1B 2P4";
  const pickupMapEmbedUrl = useMemo(
    () =>
      `https://www.google.com/maps?q=${encodeURIComponent(PICKUP_ADDRESS)}&output=embed`,
    []
  );
  const pickupMapsLink = useMemo(
    () =>
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(PICKUP_ADDRESS)}`,
    []
  );

  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    } else {
      router.push("/cart");
    }
  }, [router]);

  // Pickup-only for now (frontend enforcement).
  useEffect(() => {
    setFormData((prev) => {
      if (prev.deliveryType === "pickup") return prev;
      return { ...prev, deliveryType: "pickup", deliveryAddress: "" };
    });
  }, []);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const timeOptions = useMemo(() => {
    if (!selectedDate) return [];

    const STEP_MINUTES = 30;
    const OPEN_MINUTES = 9 * 60;
    const CLOSE_MINUTES = 18 * 60;
    const LEAD_MINUTES = 30;

    const now = new Date();
    const minutesNow = now.getHours() * 60 + now.getMinutes();

    const roundUpToStep = (minutes: number, step: number) =>
      Math.ceil(minutes / step) * step;

    const minMinutesForDay = isSameDay(now, selectedDate)
      ? roundUpToStep(minutesNow + LEAD_MINUTES, STEP_MINUTES)
      : OPEN_MINUTES;

    const start = Math.max(OPEN_MINUTES, minMinutesForDay);

    const pad2 = (n: number) => String(n).padStart(2, "0");
    const toHHMM = (minutes: number) =>
      `${pad2(Math.floor(minutes / 60))}:${pad2(minutes % 60)}`;
    const toLabel = (minutes: number) => {
      const d = new Date();
      d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
      return format(d, "h:mm a");
    };

    const slots: Array<{ value: string; label: string }> = [];
    for (let m = start; m <= CLOSE_MINUTES; m += STEP_MINUTES) {
      slots.push({ value: toHHMM(m), label: toLabel(m) });
    }
    return slots;
  }, [selectedDate]);

  // Keep selectedTime valid when date changes (e.g. choosing "today" after picking a later date).
  useEffect(() => {
    if (!selectedDate) {
      setSelectedTime("");
      setFormData((prev) => ({ ...prev, pickupDeliveryTime: "" }));
      return;
    }

    if (!selectedTime) {
      setFormData((prev) => ({ ...prev, pickupDeliveryTime: "" }));
      return;
    }

    const stillValid = timeOptions.some((o) => o.value === selectedTime);
    if (!stillValid) {
      setSelectedTime("");
      setFormData((prev) => ({ ...prev, pickupDeliveryTime: "" }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      pickupDeliveryTime: `${format(selectedDate, "yyyy-MM-dd")}T${selectedTime}`,
    }));
  }, [selectedDate, selectedTime, timeOptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.pickupDeliveryTime) {
        toast({
          title: "Please select a pickup date & time",
          description: "Choose a date first, then pick an available time slot.",
          variant: "destructive",
        });
        return;
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          deliveryType: "pickup",
          deliveryAddress: "",
          cart,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to start checkout");
      }

      if (!data?.url) {
        throw new Error("Missing Stripe redirect URL");
      }

      window.location.assign(data.url);
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Checkout failed",
        description: "Failed to start Stripe checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              required
              value={formData.customerName}
              onChange={(e) => updateField("customerName", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.customerEmail}
              onChange={(e) => updateField("customerEmail", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              required
              value={formData.customerPhone}
              onChange={(e) => updateField("customerPhone", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pickup Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-muted-foreground/20 bg-muted/20 p-4 text-sm">
            <div className="font-medium">
              Pickup only (delivery coming soon)
            </div>
            <div className="mt-1 text-muted-foreground">
              For now, all orders are pickup at our location below.
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Pickup location</Label>
            <div className="rounded-lg border p-4 space-y-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">Cookie Corner Cafe</div>
                <div className="text-sm text-muted-foreground">
                  {PICKUP_ADDRESS}
                </div>
                <a
                  href={pickupMapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary underline underline-offset-4"
                >
                  Open in Google Maps
                </a>
              </div>

              <div className="overflow-hidden rounded-md border">
                <iframe
                  title="Pickup location map"
                  src={pickupMapEmbedUrl}
                  className="h-64 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="datetime">Pickup Date & Time</Label>
            <div className="grid gap-3 md:grid-cols-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="datetime"
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4 opacity-70" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => setSelectedDate(date ?? undefined)}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const d = new Date(date);
                      d.setHours(0, 0, 0, 0);
                      return d < today;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Select
                value={selectedTime}
                onValueChange={(value) => {
                  setSelectedTime(value);
                  if (selectedDate) {
                    updateField(
                      "pickupDeliveryTime",
                      `${format(selectedDate, "yyyy-MM-dd")}T${value}`
                    );
                  }
                }}
                disabled={!selectedDate || timeOptions.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      !selectedDate
                        ? "Choose a date first"
                        : timeOptions.length
                          ? "Select a time"
                          : "No times available"
                    }
                  />
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
            </div>
            <p className="text-xs text-muted-foreground">
              Select a date, then pick an available time (today’s times start
              ~30 minutes from now).
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Special Instructions (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Any special requests or dietary requirements?"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>
                  {item.name} ({item.size}) x {item.quantity}
                </span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Processing..." : "Place Order"}
      </Button>
    </form>
  );
}
