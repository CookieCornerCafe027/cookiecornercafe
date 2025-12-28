"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  MapPin,
  Users,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export interface EventForDetail {
  id: string;
  title: string;
  description: string | null;
  image_urls: string[] | null;
  price_per_entry: number;
  capacity: number | null;
  location: string | null;
  starts_at: string | null;
  ends_at: string | null;
}

export function EventDetail({ event }: { event: EventForDetail }) {
  const { toast } = useToast();
  const router = useRouter();
  const images = event.image_urls || [];
  const hasMultipleImages = images.length > 1;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const startDate = event.starts_at ? new Date(event.starts_at) : null;
  const endDate = event.ends_at ? new Date(event.ends_at) : null;
  const isSameDay =
    !!startDate &&
    !!endDate &&
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate();
  const whenLabel = startDate
    ? endDate
      ? isSameDay
        ? `${startDate.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })} • ${startDate.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          })} – ${endDate.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          })}`
        : `${startDate.toLocaleString()} – ${endDate.toLocaleString()}`
      : startDate.toLocaleString()
    : null;

  const [ticketQty, setTicketQty] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setTicketQtyFromInput = (raw: string) => {
    const v = Number.parseInt(raw, 10);
    setTicketQty(Number.isFinite(v) ? v : 1);
  };

  const nextImage = () => {
    if (!images.length) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const previousImage = () => {
    if (!images.length) return;
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const total = event.price_per_entry * ticketQty;

  const goToCheckout = () => {
    if (!Number.isFinite(ticketQty) || ticketQty < 1 || ticketQty > 99) {
      toast({
        title: "Invalid ticket quantity",
        description: "Please choose between 1 and 99 tickets.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    router.push(`/events/${event.id}/checkout?qty=${ticketQty}`);
  };

  return (
    <>
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 pb-28 md:pb-0">
        <div className="space-y-4">
          <Card className="overflow-hidden pt-0">
            <CardContent className="p-0">
              {images.length > 0 ? (
                <div className="relative aspect-square bg-muted">
                  <Image
                    src={images[currentImageIndex]}
                    alt={`${event.title} image ${currentImageIndex + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    priority
                  />
                  {hasMultipleImages && (
                    <>
                      <button
                        type="button"
                        onClick={previousImage}
                        aria-label="Previous image"
                        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 text-white p-2 hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={nextImage}
                        aria-label="Next image"
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 text-white p-2 hover:bg-black/70 transition-colors"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {currentImageIndex + 1} / {images.length}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="aspect-square bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">No images yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {hasMultipleImages && (
            <div className="grid grid-cols-5 gap-2">
              {images.slice(0, 5).map((url, idx) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative aspect-square overflow-hidden rounded-md border ${
                    idx === currentImageIndex
                      ? "border-primary"
                      : "border-border"
                  }`}
                  aria-label={`View image ${idx + 1}`}
                >
                  <Image
                    src={url}
                    alt={`${event.title} thumbnail ${idx + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <Card className="bg-card shadow-sm">
            <CardContent className="p-6 space-y-2">
              <h2 className="text-lg font-semibold">Description</h2>
              <p className="text-muted-foreground whitespace-pre-line">
                {event.description || "Details coming soon."}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card shadow-sm">
          <CardContent className="flex flex-col gap-6 p-6">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-primary">
                {event.title}
              </h1>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <h2 className="text-sm font-semibold mb-3">Details</h2>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <DollarSign className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      Price
                    </dt>
                    <dd className="font-medium">
                      ${event.price_per_entry.toFixed(2)}{" "}
                      <span className="text-muted-foreground font-normal">
                        per entry
                      </span>
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      When
                    </dt>
                    <dd className="font-medium">
                      {whenLabel ?? "Date/time TBD"}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      Location
                    </dt>
                    <dd className="font-medium">
                      {event.location ? (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline underline-offset-4 hover:no-underline"
                        >
                          {event.location}
                        </a>
                      ) : (
                        "TBD"
                      )}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      Capacity
                    </dt>
                    <dd className="font-medium">
                      {typeof event.capacity === "number"
                        ? event.capacity
                        : "TBD"}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>

          <div className="space-y-4">
            <div className="text-lg font-semibold">Reserve your spot</div>

            <div className="hidden md:grid gap-2">
              <Label htmlFor="ticketQty">Tickets</Label>
              <Input
                id="ticketQty"
                type="number"
                inputMode="numeric"
                min={1}
                max={99}
                value={ticketQty}
                onChange={(e) => setTicketQtyFromInput(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Total:{" "}
                <span className="font-semibold text-foreground">
                  ${total.toFixed(2)}
                </span>
              </p>
            </div>

            <Button
              size="lg"
              className="w-full hidden md:inline-flex"
              onClick={goToCheckout}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Redirecting..." : "Go to checkout"}
            </Button>
            <p className="text-xs text-muted-foreground hidden md:block">
              You’ll complete contact info on the next step.
            </p>
          </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile sticky checkout bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pointer-events-none">
        <div className="container mx-auto px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
          <Card className="pointer-events-auto mx-auto w-full max-w-md shadow-xl mb-3">
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="grid gap-0.5">
                  <Label
                    htmlFor="ticketQtyMobile"
                    className="text-xs text-muted-foreground"
                  >
                    Tickets
                  </Label>
                  <Input
                    id="ticketQtyMobile"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={99}
                    value={ticketQty}
                    onChange={(e) => setTicketQtyFromInput(e.target.value)}
                    className="w-28"
                  />
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="font-semibold">${total.toFixed(2)}</div>
                </div>
              </div>

              <Button onClick={goToCheckout} disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Redirecting..." : "Go to checkout"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
