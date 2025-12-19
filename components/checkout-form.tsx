"use client"

import type React from "react"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { format, isSameDay } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function CheckoutForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cart, setCart] = useState<any[]>([])
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    deliveryType: "pickup",
    pickupDeliveryTime: "",
    deliveryAddress: "",
    notes: "",
  })
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string>("")

  useEffect(() => {
    const storedCart = localStorage.getItem("cart")
    if (storedCart) {
      setCart(JSON.parse(storedCart))
    } else {
      router.push("/cart")
    }
  }, [router])

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const timeOptions = useMemo(() => {
    if (!selectedDate) return []

    const STEP_MINUTES = 30
    const OPEN_MINUTES = 9 * 60
    const CLOSE_MINUTES = 18 * 60
    const LEAD_MINUTES = 30

    const now = new Date()
    const minutesNow = now.getHours() * 60 + now.getMinutes()

    const roundUpToStep = (minutes: number, step: number) => Math.ceil(minutes / step) * step

    const minMinutesForDay = isSameDay(now, selectedDate)
      ? roundUpToStep(minutesNow + LEAD_MINUTES, STEP_MINUTES)
      : OPEN_MINUTES

    const start = Math.max(OPEN_MINUTES, minMinutesForDay)

    const pad2 = (n: number) => String(n).padStart(2, "0")
    const toHHMM = (minutes: number) => `${pad2(Math.floor(minutes / 60))}:${pad2(minutes % 60)}`
    const toLabel = (minutes: number) => {
      const d = new Date()
      d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
      return format(d, "h:mm a")
    }

    const slots: Array<{ value: string; label: string }> = []
    for (let m = start; m <= CLOSE_MINUTES; m += STEP_MINUTES) {
      slots.push({ value: toHHMM(m), label: toLabel(m) })
    }
    return slots
  }, [selectedDate])

  // Keep selectedTime valid when date changes (e.g. choosing "today" after picking a later date).
  useEffect(() => {
    if (!selectedDate) {
      setSelectedTime("")
      setFormData((prev) => ({ ...prev, pickupDeliveryTime: "" }))
      return
    }

    if (!selectedTime) {
      setFormData((prev) => ({ ...prev, pickupDeliveryTime: "" }))
      return
    }

    const stillValid = timeOptions.some((o) => o.value === selectedTime)
    if (!stillValid) {
      setSelectedTime("")
      setFormData((prev) => ({ ...prev, pickupDeliveryTime: "" }))
      return
    }

    setFormData((prev) => ({
      ...prev,
      pickupDeliveryTime: `${format(selectedDate, "yyyy-MM-dd")}T${selectedTime}`,
    }))
  }, [selectedDate, selectedTime, timeOptions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!formData.pickupDeliveryTime) {
        toast({
          title: `Please select a ${formData.deliveryType === "pickup" ? "pickup" : "delivery"} date & time`,
          description: "Choose a date first, then pick an available time slot.",
          variant: "destructive",
        })
        return
      }

      if (formData.deliveryType === "delivery" && !formData.deliveryAddress.trim()) {
        toast({
          title: "Delivery address is required",
          description: "Please enter your full delivery address to continue.",
          variant: "destructive",
        })
        return
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          cart,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "Failed to start checkout")
      }

      if (!data?.url) {
        throw new Error("Missing Stripe redirect URL")
      }

      window.location.assign(data.url)
    } catch (error) {
      console.error("Error creating order:", error)
      toast({
        title: "Checkout failed",
        description: "Failed to start Stripe checkout. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              required
              value={formData.customerName}
              onChange={(e) => updateField("customerName", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.customerEmail}
              onChange={(e) => updateField("customerEmail", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              required
              value={formData.customerPhone}
              onChange={(e) => updateField("customerPhone", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={formData.deliveryType} onValueChange={(value) => updateField("deliveryType", value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pickup" id="pickup" />
              <Label htmlFor="pickup" className="cursor-pointer">
                Pickup
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="delivery" id="delivery" />
              <Label htmlFor="delivery" className="cursor-pointer">
                Delivery
              </Label>
            </div>
          </RadioGroup>

          {formData.deliveryType === "delivery" && (
            <div className="grid gap-2">
              <Label htmlFor="address">Delivery Address</Label>
              <Textarea
                id="address"
                required
                value={formData.deliveryAddress}
                onChange={(e) => updateField("deliveryAddress", e.target.value)}
                placeholder="Enter your full delivery address"
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="datetime">{formData.deliveryType === "pickup" ? "Pickup" : "Delivery"} Date & Time</Label>
            <div className="grid gap-3 md:grid-cols-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="datetime"
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4 opacity-70" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => setSelectedDate(date ?? undefined)}
                    disabled={(date) => {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const d = new Date(date)
                      d.setHours(0, 0, 0, 0)
                      return d < today
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Select
                value={selectedTime}
                onValueChange={(value) => {
                  setSelectedTime(value)
                  if (selectedDate) {
                    updateField("pickupDeliveryTime", `${format(selectedDate, "yyyy-MM-dd")}T${value}`)
                  }
                }}
                disabled={!selectedDate || timeOptions.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={!selectedDate ? "Choose a date first" : timeOptions.length ? "Select a time" : "No times available"} />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      <span className="inline-flex items-center gap-2">
                        <Clock className="size-4 opacity-70" />
                        {o.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Select a date, then pick an available time (today’s times start ~30 minutes from now).
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Special Instructions (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Any special requests or dietary requirements?"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>
                  {item.name} ({item.size}) x {item.quantity}
                </span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Processing..." : "Place Order"}
      </Button>
    </form>
  )
}
