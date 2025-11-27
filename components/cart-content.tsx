"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Plus, Minus } from "lucide-react"
import { useRouter } from "next/navigation"

interface CartItem {
  id: string
  name: string
  price: number
  size: string
  quantity: number
  customizations?: string[]
}

const normalizeCart = (items: CartItem[]): CartItem[] => {
  const map = new Map<string, CartItem>()

  for (const item of items) {
    const key = [
      item.id,
      item.size,
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

export function CartContent() {
  const [cart, setCart] = useState<CartItem[]>([])
  const router = useRouter()

  useEffect(() => {
    const storedCart = localStorage.getItem("cart")
    if (storedCart) {
      try {
        const parsed: CartItem[] = JSON.parse(storedCart)
        const normalized = normalizeCart(parsed)
        setCart(normalized)
        localStorage.setItem("cart", JSON.stringify(normalized))
      } catch {
        setCart([])
      }
    }
  }, [])

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart)
    localStorage.setItem("cart", JSON.stringify(newCart))
  }

  const removeItem = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index)
    updateCart(newCart)
  }

  const updateQuantity = (index: number, change: number) => {
    const newCart = [...cart]
    newCart[index].quantity = Math.max(1, newCart[index].quantity + change)
    updateCart(newCart)
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  if (cart.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">Your cart is empty</p>
          <Button onClick={() => router.push("/")}>Continue Shopping</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cart.map((item, index) => (
            <div key={index} className="flex items-center gap-4 pb-4 border-b last:border-0">
              <div className="flex-1">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-muted-foreground">Size: {item.size}</p>
                {item.customizations && item.customizations.length > 0 && (
                  <p className="text-sm text-muted-foreground">Customizations: {item.customizations.join(", ")}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => updateQuantity(index, -1)}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button variant="outline" size="icon" onClick={() => updateQuantity(index, 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-right w-24">
                <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-2">
            Need something special? You can add custom instructions (messages, allergies, delivery notes) at checkout.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <span className="text-lg font-semibold">Total:</span>
          <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
        </CardFooter>
      </Card>

      <Button size="lg" onClick={() => router.push("/checkout")} className="w-full">
        Proceed to Checkout
      </Button>
    </div>
  )
}
