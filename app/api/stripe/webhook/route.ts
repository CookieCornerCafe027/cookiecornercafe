import { NextResponse } from "next/server"

import { getStripe } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const stripe = getStripe()

  const signature = req.headers.get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }
  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 })
  }

  const rawBody = await req.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${err?.message ?? "unknown"}` }, { status: 400 })
  }

  // Only fulfill on successful payment.
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any
    const orderId = session?.metadata?.orderId

    if (orderId) {
      const supabase = createAdminClient()

      // Mark order as confirmed after Stripe confirms payment.
      const { error } = await supabase.from("orders").update({ status: "confirmed" }).eq("id", orderId)
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ received: true })
}


