"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export interface EventForDetail {
  id: string;
  title: string;
  description: string | null;
  image_urls: string[] | null;
  price_per_entry: number;
  capacity: number | null;
  location: string | null;
}

export function EventDetail({ event }: { event: EventForDetail }) {
  const images = event.image_urls || [];
  const hasMultipleImages = images.length > 1;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    if (!images.length) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const previousImage = () => {
    if (!images.length) return;
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
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
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-display font-bold">
            {event.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              ${event.price_per_entry.toFixed(2)} per entry
            </Badge>
            {event.location ? (
              <Badge variant="outline" className="gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </Badge>
            ) : null}
            {typeof event.capacity === "number" ? (
              <Badge variant="outline" className="gap-1">
                <Users className="h-3.5 w-3.5" />
                Capacity {event.capacity}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Description</h2>
          <p className="text-muted-foreground whitespace-pre-line">
            {event.description || "Details coming soon."}
          </p>
        </div>
      </div>
    </div>
  );
}


