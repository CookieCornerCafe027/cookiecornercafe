import { EventCard, type EventForCard } from "@/components/event-card";

export interface EventGridProps {
  events: EventForCard[];
}

export function EventGrid({ events }: EventGridProps) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No events scheduled right now. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}




