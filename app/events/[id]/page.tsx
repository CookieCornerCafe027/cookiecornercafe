import { Header } from "@/components/header"
import { EventDetail } from "@/components/event-detail"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ canceled?: string }>
}

export default async function EventPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const sp = await searchParams
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
      <main className="container mx-auto py-8 px-0 sm:px-4">
        {sp.canceled && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
            Payment was canceled. Your spot isn’t reserved yet — you can try
            again when ready.
          </div>
        )}
        <EventDetail event={event as any} />
      </main>
    </>
  )
}


