import { Header } from "@/components/header"
import { EventDetail } from "@/components/event-detail"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EventPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !event) {
    notFound()
  }

  return (
    <>
      <Header />
      <main className="container mx-auto py-8 px-4">
        <EventDetail event={event as any} />
      </main>
    </>
  )
}


