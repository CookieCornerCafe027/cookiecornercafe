"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn, getOptimizedImageUrl } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"

interface Product {
  id: string
  name: string
  description: string | null
  image_urls: string[] | null
}

interface Event {
  id: string
  title: string
  description: string | null
  image_urls: string[] | null
  starts_at: string | null
  ends_at: string | null
}

interface HeroCarouselProps {
  products: Product[]
  events: Event[]
}

export function HeroCarousel({ products, events }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Build slides: prioritize events, then products
  const slides = [
    // Featured events first (up to 3)
    ...events.slice(0, 3).map((event) => {
      const startDate = event.starts_at ? new Date(event.starts_at) : null
      return {
        type: "event" as const,
        id: event.id,
        title: event.title,
        description: event.description || "Join us for a special event",
        imageUrl: getOptimizedImageUrl(event.image_urls?.[0], {
          width: 1600,
          quality: 78,
          format: "webp",
        }) || "/placeholder.jpg",
        eventDate: startDate?.toISOString().split('T')[0] || null,
        eventTime: startDate ? startDate.toLocaleTimeString("en-US", { 
          hour: "numeric", 
          minute: "2-digit",
          hour12: true 
        }) : null,
        accent: "🎉",
      }
    }),
    // Featured products (up to 3)
    ...products.slice(0, 3).map((product) => ({
      type: "product" as const,
      id: product.id,
      title: product.name,
      description: product.description || "Delicious handcrafted treats",
      imageUrl: getOptimizedImageUrl(product.image_urls?.[0], {
        width: 1600,
        quality: 78,
        format: "webp",
      }) || "/placeholder.jpg",
      accent: "🍰",
    })),
  ]

  // Fallback if no data
  if (slides.length === 0) {
    slides.push({
      type: "product" as const,
      id: "default",
      title: "Handcrafted Crepe Cakes",
      description: "Delicate layers of love in every bite. Made fresh daily with premium ingredients.",
      imageUrl: "/placeholder.jpg",
      accent: "🍰",
    })
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
  }

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(nextSlide, 5000)
    return () => clearInterval(interval)
  }, [isAutoPlaying, slides.length])

  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Main carousel content */}
          <div className="relative">
            <div className="relative h-[500px] md:h-[550px]">
              {slides.map((slide, index) => (
                <div
                  key={`${slide.type}-${slide.id}`}
                  className={cn(
                    "absolute inset-0 transition-all duration-700 ease-in-out",
                    index === currentSlide
                      ? "opacity-100 translate-y-0 z-10"
                      : "opacity-0 translate-y-8 pointer-events-none z-0"
                  )}
                >
                  {/* Card with angled divider */}
                  <div className="relative bg-card/95 backdrop-blur-lg rounded-3xl overflow-hidden shadow-2xl border-2 border-border/30 mx-auto max-w-5xl h-full">
                  <div className="grid md:grid-cols-2 h-full">
                    {/* Image Side with angled edge */}
                    <div className="relative order-1 md:order-1 h-full">
                      {/* Angled divider overlay */}
                      <div 
                        className="hidden md:block absolute top-0 right-0 h-full w-8 bg-card z-10"
                        style={{
                          clipPath: "polygon(100% 0, 0 0, 100% 100%)"
                        }}
                      />
                      <div className="relative h-full">
                        <Image
                          src={slide.imageUrl}
                          alt={slide.title}
                          fill
                          className="object-cover md:[clip-path:polygon(0_0,_100%_0,_94%_100%,_0_100%)]"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          priority={index === 0}
                        />
                      </div>

                      {/* Mobile nav overlay (keep desktop arrows outside the card) */}
                      <div className="md:hidden absolute inset-x-0 top-1/2 -translate-y-1/2 px-3 flex items-center justify-between z-20 pointer-events-none">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="pointer-events-auto rounded-full h-11 w-11 bg-card/80 backdrop-blur hover:bg-card shadow-lg"
                          onClick={() => {
                            prevSlide()
                            setIsAutoPlaying(false)
                          }}
                          aria-label="Previous slide"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="pointer-events-auto rounded-full h-11 w-11 bg-card/80 backdrop-blur hover:bg-card shadow-lg"
                          onClick={() => {
                            nextSlide()
                            setIsAutoPlaying(false)
                          }}
                          aria-label="Next slide"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </Button>
                      </div>

                      {/* Mobile CTA overlay (hide all other content on mobile) */}
                      <div className="md:hidden absolute inset-x-0 bottom-0 z-20">
                        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="relative px-4 pb-4 pt-10">
                          <div className="flex flex-col gap-2">
                            {slide.type === "event" ? (
                              <>
                                <Button
                                  size="lg"
                                  className="w-full text-base px-6 py-5 rounded-full shadow-lg hover:shadow-xl transition-all"
                                  asChild
                                >
                                  <Link href={`/events/${slide.id}`}>Book Now</Link>
                                </Button>
                                <Button
                                  size="lg"
                                  variant="outline"
                                  className="w-full text-base px-6 py-5 rounded-full bg-card/70 backdrop-blur shadow-lg hover:shadow-xl transition-all"
                                  asChild
                                >
                                  <Link href="/events">All Events</Link>
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="lg"
                                  className="w-full text-base px-6 py-5 rounded-full shadow-lg hover:shadow-xl transition-all"
                                  asChild
                                >
                                  <Link href={`/product/${slide.id}`}>Order Now</Link>
                                </Button>
                                <Button
                                  size="lg"
                                  variant="outline"
                                  className="w-full text-base px-6 py-5 rounded-full bg-card/70 backdrop-blur shadow-lg hover:shadow-xl transition-all"
                                  asChild
                                >
                                  <Link href="#creations">View Menu</Link>
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content Side */}
                    <div className="hidden md:flex order-2 md:order-2 p-8 md:p-12 flex-col justify-center space-y-3 md:space-y-4 overflow-hidden">
                      {/* Event Badge - Reserve space even when not shown */}
                      <div className="h-[42px] flex items-start">
                        {slide.type === "event" && (slide.eventDate || slide.eventTime) && (
                          <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur px-4 py-2 rounded-full border-2 border-primary/30">
                            <Calendar className="h-5 w-5 text-primary" />
                            <span className="text-sm font-semibold text-foreground">
                              {slide.eventDate && new Date(slide.eventDate).toLocaleDateString("en-US", { 
                                month: "short", 
                                day: "numeric",
                                year: "numeric"
                              })}
                              {slide.eventTime && ` • ${slide.eventTime}`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Title with artistic styling */}
                      <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight line-clamp-2">
                        <span className="inline-block animate-gradient bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] bg-clip-text text-transparent">
                          {slide.title}
                        </span>
                      </h1>

                      {/* Description */}
                      <p className="text-base md:text-lg text-muted-foreground line-clamp-3">
                        {slide.description}
                      </p>

                      {/* CTA Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        {slide.type === "event" ? (
                          <>
                            <Button
                              size="lg"
                              className="text-base px-6 py-5 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
                              asChild
                            >
                              <Link href={`/events/${slide.id}`}>Book Now</Link>
                            </Button>
                            <Button
                              size="lg"
                              variant="outline"
                              className="text-base px-6 py-5 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
                              asChild
                            >
                              <Link href="/events">All Events</Link>
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="lg"
                              className="text-base px-6 py-5 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
                              asChild
                            >
                              <Link href={`/product/${slide.id}`}>Order Now</Link>
                            </Button>
                            <Button
                              size="lg"
                              variant="outline"
                              className="text-base px-6 py-5 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
                              asChild
                            >
                              <Link href="#creations">View Menu</Link>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>

          {/* Dots indicator - centered below content */}
          <div className="flex gap-2 justify-center mt-12">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  "h-3 rounded-full transition-all duration-300",
                  index === currentSlide
                    ? "w-12 bg-primary"
                    : "w-3 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Navigation arrows - positioned on sides */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:inline-flex absolute left-4 top-1/2 -translate-y-1/2 rounded-full h-14 w-14 bg-card/80 backdrop-blur hover:bg-card shadow-lg z-20"
        onClick={() => {
          prevSlide()
          setIsAutoPlaying(false)
        }}
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-7 w-7" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="hidden md:inline-flex absolute right-4 top-1/2 -translate-y-1/2 rounded-full h-14 w-14 bg-card/80 backdrop-blur hover:bg-card shadow-lg z-20"
        onClick={() => {
          nextSlide()
          setIsAutoPlaying(false)
        }}
        aria-label="Next slide"
      >
        <ChevronRight className="h-7 w-7" />
      </Button>
    </section>
  )
}

