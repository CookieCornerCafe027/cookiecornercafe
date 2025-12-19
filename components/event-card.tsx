import Link from "next/link";
import Image from "next/image";

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
}

export function EventCard({ event }: { event: EventForCard }) {
  const primaryImage = event.image_urls?.[0];

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col pt-0">
      <Link href={`/events/${event.id}`} className="flex flex-col gap-6 flex-1">
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
      </Link>

      <CardFooter className="flex items-center justify-between mt-auto">
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


