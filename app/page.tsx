import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { ProductGrid } from "@/components/product-grid"
import { EventGrid } from "@/components/event-grid"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function Home() {
  const supabase = await createClient()

  // Fetch all active products
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching products:", error)
  }

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(3)

  if (eventsError) {
    console.error("Error fetching events:", eventsError)
  }

  return (
    <>
      <Header />
      <main className="container mx-auto py-8">
        {/* Hero Section */}
        <section className="mb-12 text-center">
          <div className="bg-card/80 backdrop-blur rounded-3xl p-8 md:p-12 border-2 border-border shadow-xl">
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-4 text-balance">
              Handcrafted Crepe Cakes & Sweet Treats
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Delicate layers of love in every bite. Made fresh daily with premium ingredients.
            </p>
          </div>
        </section>

        {/* Products Section */}
        <section>
          <h2 className="text-3xl font-display font-bold mb-6 text-center">Our Creations</h2>
          <ProductGrid products={products || []} />
        </section>

        {/* Events Section */}
        <section className="mt-16">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <h2 className="text-3xl font-display font-bold text-center sm:text-left">
              Events
            </h2>
            <Button asChild variant="outline">
              <Link href="/events">View all events</Link>
            </Button>
          </div>
          <EventGrid events={(events as any) || []} />
        </section>
      </main>
    </>
  )
}
