import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Section */}
          <section className="text-center">
            <div className="bg-card/80 backdrop-blur rounded-3xl p-8 md:p-12 border-2 border-border shadow-xl">
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-balance">
                Welcome to Cookie Corner
              </h1>
              <p className="text-lg text-muted-foreground text-balance">
                Where every layer tells a story of love, craftsmanship, and sweet indulgence
              </p>
            </div>
          </section>

          {/* Story Section */}
          <section className="grid md:grid-cols-2 gap-8 items-center">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-3xl font-display font-bold mb-4 text-primary">Our Story</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Cookie Corner began with a simple dream: to bring the delicate art of French crepe cakes to our
                    community. What started as a passion project in a home kitchen has blossomed into a beloved local
                    bakery known for our signature layered creations.
                  </p>
                  <p>
                    Each of our crepe cakes is a labor of love, featuring up to 20 paper-thin crepes layered with
                    premium pastry cream. We use only the finest ingredients, sourced locally whenever possible, to
                    create treats that are as beautiful as they are delicious.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="aspect-square relative rounded-3xl overflow-hidden bg-muted">
              <Image src="/beautiful-matcha-crepe-cake-with-strawberries.jpg" alt="Our signature crepe cakes" fill className="object-cover" />
            </div>
          </section>

          {/* Values Section */}
          <section>
            <h2 className="text-3xl font-display font-bold mb-8 text-center text-primary">What Makes Us Special</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">🥞</div>
                  <h3 className="text-xl font-semibold mb-2">Handcrafted Excellence</h3>
                  <p className="text-sm text-muted-foreground">
                    Every crepe is made by hand, ensuring consistent quality and attention to detail in every layer.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">🌱</div>
                  <h3 className="text-xl font-semibold mb-2">Fresh Ingredients</h3>
                  <p className="text-sm text-muted-foreground">
                    We use premium, locally-sourced ingredients and make everything fresh daily for optimal flavor.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">💝</div>
                  <h3 className="text-xl font-semibold mb-2">Made with Love</h3>
                  <p className="text-sm text-muted-foreground">
                    Each creation is a work of art, made with care and passion to bring joy to your celebrations.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Our Creations Section */}
          <section className="bg-card/80 backdrop-blur rounded-3xl p-8 border-2 border-border">
            <h2 className="text-3xl font-display font-bold mb-6 text-center text-primary">Our Creations</h2>
            <div className="space-y-4 text-muted-foreground max-w-2xl mx-auto">
              <p className="text-center">
                Our signature crepe cakes are perfect for any celebration - birthdays, anniversaries, or simply treating
                yourself to something special. We also offer cookies and pastries for those looking for a smaller
                indulgence.
              </p>
              <p className="text-center">
                All of our products can be customized to match your preferences and dietary needs. Whether you're
                looking for classic flavors or something unique, we're here to make your sweet dreams come true.
              </p>
            </div>
          </section>

          {/* Contact/Order Section */}
          <section className="text-center bg-primary/10 rounded-3xl p-8">
            <h2 className="text-2xl font-display font-bold mb-4">Ready to Order?</h2>
            <p className="text-muted-foreground mb-6">
              Browse our selection and place your order for pickup or delivery
            </p>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              View Our Menu
            </a>
          </section>
        </div>
      </main>
    </>
  )
}
