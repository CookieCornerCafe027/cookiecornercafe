import { NextResponse } from "next/server";

import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResend, getResendFrom } from "@/lib/resend";
import {
  renderOrderConfirmationEmail,
  type OrderForEmail,
} from "@/lib/emails/order-confirmation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = getStripe();

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET" },
      { status: 500 }
    );
  }

  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    return NextResponse.json(
      {
        error: `Webhook signature verification failed: ${err?.message ?? "unknown"}`,
      },
      { status: 400 }
    );
  }

  // Only fulfill on successful payment.
  // Note: for some async payment methods, Stripe may send `checkout.session.completed`
  // with `payment_status: "unpaid"` and later send `checkout.session.async_payment_succeeded`.
  const isCheckoutPaidEvent =
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded";
  const isCheckoutFailedEvent =
    event.type === "checkout.session.async_payment_failed";

  if (isCheckoutPaidEvent || isCheckoutFailedEvent) {
    const session = event.data.object as any;
    const orderId = session?.metadata?.orderId;

    if (orderId) {
      const supabase = createAdminClient();

      // Load order details for email + idempotency.
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(
          "id,customer_name,customer_email,customer_phone,price_paid,product_orders,delivery_type,pickup_delivery_time,delivery_address,notes,status,confirmation_email_sent_at"
        )
        .eq("id", orderId)
        .maybeSingle();

      if (orderError) {
        return NextResponse.json(
          { error: orderError.message },
          { status: 500 }
        );
      }

      // Best-effort: store Stripe session id for reconciliation / debugging.
      const { error: sessionIdError } = await supabase
        .from("orders")
        .update({ stripe_session_id: session?.id })
        .eq("id", orderId);
      if (sessionIdError) {
        const msg = sessionIdError.message ?? "";
        const isMissingColumn =
          msg.includes("'stripe_session_id'") &&
          msg.toLowerCase().includes("schema cache");
        if (!isMissingColumn) {
          return NextResponse.json({ error: msg }, { status: 500 });
        }
      }

      // If Stripe tells us the async payment failed, keep the order pending (or handle manually).
      // We intentionally do not auto-cancel here because the DB currently only supports a limited
      // status enum and businesses often want to review/retry payment flows.
      if (isCheckoutFailedEvent) {
        return NextResponse.json({ received: true });
      }

      const paymentStatus = (session?.payment_status ?? "").toString();
      const isPaid =
        paymentStatus === "paid" || paymentStatus === "no_payment_required";
      if (!isPaid) {
        // For async methods this can be "unpaid" on `checkout.session.completed`.
        // We'll wait for `checkout.session.async_payment_succeeded`.
        return NextResponse.json({ received: true });
      }

      // Mark order as confirmed after Stripe confirms payment (idempotent).
      // Keep this update independent of optional Stripe reconciliation fields so it won't fail if
      // the database hasn't applied migration 006 yet.
      const { error: confirmError } = await supabase
        .from("orders")
        .update({ status: "confirmed" })
        .eq("id", orderId);
      if (confirmError) {
        return NextResponse.json(
          { error: confirmError.message },
          { status: 500 }
        );
      }

      // Send confirmation email once per order.
      const emailAlreadySent = Boolean(
        (order as any)?.confirmation_email_sent_at
      );
      if (order && !emailAlreadySent) {
        const hasResendConfig = Boolean(
          process.env.RESEND_API_KEY && process.env.ORDER_NOTIFICATION_EMAIL
        );
        if (hasResendConfig) {
          try {
            const resend = getResend();
            const from = getResendFrom();
            const { subject, html, text } = renderOrderConfirmationEmail(
              order as OrderForEmail
            );

            const adminNotify = process.env.ORDER_NOTIFICATION_EMAIL;
            const bcc = adminNotify ? [adminNotify] : undefined;

            const result = await resend.emails.send({
              from,
              to: (order as any).customer_email,
              subject,
              html,
              text,
              bcc,
            });

            if (result.error) {
              return NextResponse.json(
                { error: result.error.message },
                { status: 500 }
              );
            }

            const { error: sentAtError } = await supabase
              .from("orders")
              .update({ confirmation_email_sent_at: new Date().toISOString() })
              .eq("id", orderId)
              .is("confirmation_email_sent_at", null);
            if (sentAtError) {
              return NextResponse.json(
                { error: sentAtError.message },
                { status: 500 }
              );
            }
          } catch (err: any) {
            const message = err?.message ?? "Failed to send confirmation email";
            return NextResponse.json({ error: message }, { status: 500 });
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
