"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, ShoppingCart } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface CartItem {
  id: string
  name: string
  price: number
  size: string | null
  quantity: number
  customizations?: string[]
}

const normalizeCart = (items: CartItem[]): CartItem[] => {
  const map = new Map<string, CartItem>()

  for (const item of items) {
    const key = [
      item.id,
      item.size ?? "",
      Array.isArray(item.customizations) ? item.customizations.join("|") : "",
    ].join("::")

    const existing = map.get(key)
    if (existing) {
      existing.quantity += item.quantity
    } else {
      map.set(key, { ...item })
    }
  }

  return Array.from(map.values())
}

export function Header() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const navItems = useMemo(
    () => [
      { href: "/", label: "Shop" },
      { href: "/events", label: "Events" },
      { href: "/about", label: "About" },
    ],
    [],
  )

  // Load cart from localStorage and subscribe to cartUpdated events
  useEffect(() => {
    const loadCart = () => {
      try {
        const storedCart = localStorage.getItem("cart")
        if (storedCart) {
          const parsed: CartItem[] = JSON.parse(storedCart)
          const normalized = normalizeCart(parsed)
          setCart(normalized)
          localStorage.setItem("cart", JSON.stringify(normalized))
        } else {
          setCart([])
        }
      } catch {
        setCart([])
      }
    }

    loadCart()

    const handleCartUpdated = () => {
      loadCart()
      setIsOpen(true)
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 400)
    }

    if (typeof window !== "undefined") {
      window.addEventListener("cartUpdated", handleCartUpdated)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("cartUpdated", handleCartUpdated)
      }
    }
  }, [])

  const itemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  )

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  )

  const handleCheckout = () => {
    setIsOpen(false)
    router.push("/checkout")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-3xl font-display font-bold text-primary">Cookie Corner</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="hidden md:!flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:!hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 sm:w-80">
              <SheetHeader>
                <SheetTitle className="font-display text-2xl text-primary">
                  Cookie Corner
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 px-4 pb-4">
                {navItems.map((item) => (
                  <SheetClose key={item.href} asChild>
                    <Link
                      href={item.href}
                      className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
                <div className="mt-2 border-t pt-2">
                  <SheetClose asChild>
                    <Link
                      href="/cart"
                      className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      View Cart
                    </Link>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                className="relative gap-2"
                aria-label="Open cart"
              >
                <ShoppingCart
                  className={cn(
                    "h-4 w-4",
                    isAnimating && "animate-bounce",
                  )}
                />
                <span className="hidden sm:inline">Cart</span>
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-secondary px-1.5 text-xs font-semibold text-secondary-foreground shadow-md">
                    {itemCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <Card className="border-0 shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>Your Cart</span>
                    {itemCount > 0 && (
                      <span className="text-xs font-medium text-muted-foreground">
                        {itemCount} item{itemCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-64 space-y-3 overflow-auto px-4 pb-3">
                  {cart.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Your cart is empty. Treat yourself to something sweet!
                    </p>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={`${item.id}-${item.size}`}
                        className="flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-tight">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.size && <span className="mr-1 capitalize">{item.size}</span>}
                            × {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-semibold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-3 border-t px-4 py-3">
                  <div className="flex w-full items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex w-full gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setIsOpen(false)
                        router.push("/cart")
                      }}
                    >
                      View Cart
                    </Button>
                    <Button
                      className="flex-1"
                      disabled={cart.length === 0}
                      onClick={handleCheckout}
                    >
                      Checkout
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  )
}
