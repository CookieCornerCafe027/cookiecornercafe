import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { ProductGrid } from "@/components/product-grid"
import { EventGrid } from "@/components/event-grid"
import { LandingWallpaper } from "@/components/landing-wallpaper"
import { HeroCarousel } from "@/components/hero-carousel"
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
    <LandingWallpaper imageUrl="/images/cc.jpeg">
      <Header />
      
      {/* Hero Carousel - Full viewport height with wallpaper */}
      <HeroCarousel products={products || []} events={events || []} />

      {/* Products and Events - Solid background */}
      <main className="w-full bg-background">
        {/* Products Section - Solid background for faster paint */}
        <section id="creations" className="w-full bg-background py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-display font-bold mb-6 text-center">Our Creations</h2>
            <ProductGrid products={products || []} />
          </div>
        </section>

        {/* Events Section - Solid background for faster paint */}
        <section className="w-full bg-background py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <h2 className="text-3xl font-display font-bold text-center sm:text-left">
                Events
              </h2>
              <Button asChild variant="outline">
                <Link href="/events">View all events</Link>
              </Button>
            </div>
            <EventGrid events={(events as any) || []} />
          </div>
        </section>
      </main>
    </LandingWallpaper>
  )
}
