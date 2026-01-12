import Link from "next/link";
import Image from "next/image";
import { getOptimizedImageUrl } from "@/lib/utils";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface EventForCard {
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

export function EventCard({ event }: { event: EventForCard }) {
  const primaryImage = getOptimizedImageUrl(event.image_urls?.[0], {
    width: 900,
    quality: 75,
    format: "webp",
  });
  const startLabel = event.starts_at ? new Date(event.starts_at).toLocaleString() : null;

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col pt-0">
      {/* Full-card link for reliable tapping on mobile */}
      <Link
        href={`/events/${event.id}`}
        aria-label={`View ${event.title}`}
        className="absolute inset-0 z-0"
      />

      <div className="relative z-10 flex flex-col flex-1 pointer-events-none">
        {primaryImage ? (
          <div className="aspect-square relative bg-muted">
            <Image
              src={primaryImage}
              alt={event.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform hover:scale-105"
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
            />
            {event.image_urls && event.image_urls.length > 1 && (
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                +{event.image_urls.length - 1} more
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-square relative bg-muted flex items-center justify-center">
            <p className="text-muted-foreground text-sm">No image available</p>
          </div>
        )}

        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg leading-tight">{event.title}</CardTitle>
            {event.location ? (
              <Badge variant="secondary" className="shrink-0">
                {event.location}
              </Badge>
            ) : null}
          </div>
          {startLabel ? (
            <p className="text-xs text-muted-foreground">{startLabel}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Date/time: TBD</p>
          )}
          {event.description ? (
            <CardDescription className="line-clamp-2">
              {event.description}
            </CardDescription>
          ) : (
            <CardDescription className="text-muted-foreground">
              Event details coming soon.
            </CardDescription>
          )}
        </CardHeader>
      </div>

      <CardFooter className="relative z-10 flex items-center justify-between mt-auto pointer-events-auto">
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-primary">
            ${event.price_per_entry.toFixed(2)}
          </span>
          {typeof event.capacity === "number" ? (
            <span className="text-xs text-muted-foreground">
              Capacity: {event.capacity}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Capacity: TBD</span>
          )}
        </div>
        <Button asChild>
          <Link href={`/events/${event.id}`}>View</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}


