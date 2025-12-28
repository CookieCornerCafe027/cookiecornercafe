import { Header } from "@/components/header"
import { EventGrid } from "@/components/event-grid"
import { createClient } from "@/lib/supabase/server"

export default async function EventsPage() {
  const supabase = await createClient()

  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .eq("is_active", true)
    // Show upcoming events first (falls back to created_at if starts_at is null)
    .order("starts_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching events:", error)
  }

  return (
    <>
      <Header />
      <main className="container mx-auto py-8 px-4">
        <section className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-3">
            Events
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Pop-ups, tastings, and special nights — reserve your spot and come
            say hi.
          </p>
        </section>

        <section>
          <EventGrid events={(events as any) || []} />
        </section>
      </main>
    </>
  )
}


