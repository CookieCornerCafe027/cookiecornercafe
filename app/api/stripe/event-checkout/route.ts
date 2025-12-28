import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "node:crypto";

import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const STRIPE_CURRENCY = (process.env.STRIPE_CURRENCY ?? "cad").toLowerCase();

const EventCheckoutRequestSchema = z.object({
  eventId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(1),
});

function getBaseUrl(req: Request) {
  const envBaseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL;
  if (envBaseUrl) return envBaseUrl.replace(/\/+$/, "");

  const origin = req.headers.get("origin");
  if (origin) return origin.replace(/\/+$/, "");

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const requestUrl = new URL(req.url);
  if (!host) return requestUrl.origin;

  const isLocalhost =
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("0.0.0.0") ||
    host.includes("localhost:");
  const proto =
    forwardedProto ??
    (isLocalhost ? "http" : requestUrl.protocol.replace(":", "") || "https");
  return `${proto}://${host}`.replace(/\/+$/, "");
}

function toCents(amount: number) {
  return Math.round(amount * 100);
}

function looksLikeMissingEventRegistrationsTable(err: any) {
  const msg = (err?.message ?? err?.toString?.() ?? "").toString().toLowerCase();
  return (
    msg.includes("event_registrations") &&
    (msg.includes("does not exist") ||
      msg.includes("not found") ||
      msg.includes("schema cache") ||
      msg.includes("relation"))
  );
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const input = EventCheckoutRequestSchema.parse(json);

    const stripe = getStripe();
    const supabase = createAdminClient();

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id,title,price_per_entry,capacity,is_active")
      .eq("id", input.eventId)
      .maybeSingle();
    if (eventError) throw eventError;
    if (!event || !event.is_active) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const unitPrice = Number((event as any).price_per_entry);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return NextResponse.json(
        { error: "Invalid event price" },
        { status: 400 }
      );
    }

    // Capacity enforcement (best effort; final enforcement is still server-side here).
    const capacity = (event as any).capacity as number | null;
    if (typeof capacity === "number") {
      const { data: regs, error: regsError } = await supabase
        .from("event_registrations")
        .select("quantity,status")
        .eq("event_id", input.eventId)
        .in("status", ["pending", "confirmed"]);
      if (regsError) {
        if (looksLikeMissingEventRegistrationsTable(regsError)) {
          return NextResponse.json(
            {
              error:
                "Database is missing `event_registrations`. Apply Supabase migration `010_create_event_registrations_table.sql` and try again.",
            },
            { status: 500 }
          );
        }
        throw regsError;
      }

      const used =
        (regs ?? []).reduce((sum: number, r: any) => sum + Number(r.quantity), 0) ||
        0;
      if (used + input.quantity > capacity) {
        return NextResponse.json(
          { error: "Not enough spots left for this event" },
          { status: 409 }
        );
      }
    }

    const registrationId = crypto.randomUUID();
    const total = unitPrice * input.quantity;

    const { error: insertError } = await supabase
      .from("event_registrations")
      .insert({
        id: registrationId,
        event_id: input.eventId,
        customer_name: input.customerName,
        customer_email: input.customerEmail,
        customer_phone: input.customerPhone,
        quantity: input.quantity,
        price_paid: total,
        status: "pending",
      });
    if (insertError) {
      if (looksLikeMissingEventRegistrationsTable(insertError)) {
        return NextResponse.json(
          {
            error:
              "Database is missing `event_registrations`. Apply Supabase migration `010_create_event_registrations_table.sql` and try again.",
          },
          { status: 500 }
        );
      }
      throw insertError;
    }

    const baseUrl = getBaseUrl(req);
    const successUrl = new URL("/event-success", baseUrl);
    successUrl.searchParams.set("registrationId", registrationId);

    const cancelUrl = new URL(`/events/${input.eventId}`, baseUrl);
    cancelUrl.searchParams.set("canceled", "1");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: STRIPE_CURRENCY,
            product_data: {
              name: `${(event as any).title} — Event ticket`,
            },
            unit_amount: toCents(unitPrice),
          },
          quantity: input.quantity,
        },
      ],
      customer_email: input.customerEmail,
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      metadata: {
        type: "event",
        eventRegistrationId: registrationId,
        eventId: input.eventId,
        currency: STRIPE_CURRENCY,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe session created without a redirect URL" },
        { status: 500 }
      );
    }

    // Best-effort: store Stripe session id for reconciliation / idempotent webhook handling.
    const { error: sessionIdError } = await supabase
      .from("event_registrations")
      .update({ stripe_session_id: session.id })
      .eq("id", registrationId);
    if (sessionIdError) {
      if (looksLikeMissingEventRegistrationsTable(sessionIdError)) {
        return NextResponse.json(
          {
            error:
              "Database is missing `event_registrations`. Apply Supabase migration `010_create_event_registrations_table.sql` and try again.",
          },
          { status: 500 }
        );
      }
      throw sessionIdError;
    }

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    const message = err?.message ?? "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


