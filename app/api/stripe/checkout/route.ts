import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "node:crypto";

import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const STRIPE_CURRENCY = (process.env.STRIPE_CURRENCY ?? "cad").toLowerCase();

function isMissingColumnError(err: any, column: string) {
  const msg = (err?.message ?? err?.toString?.() ?? "").toString();
  // Supabase/PostgREST error typically looks like:
  // "Could not find the 'stripe_session_id' column of 'orders' in the schema cache"
  return (
    msg.includes(`'${column}'`) && msg.toLowerCase().includes("schema cache")
  );
}

const CartItemSchema = z.object({
  id: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  size: z.string().nullable().optional(), // Legacy size key (small, medium, large)
  sizeIndex: z.number().nullable().optional(), // New: index into product's size_options array
  sizeLabel: z.string().nullable().optional(), // Display label for size
  customizations: z.array(z.string()).optional(),
});

const CheckoutRequestSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(1),
  deliveryType: z.enum(["pickup", "delivery"]),
  pickupDeliveryTime: z.string().min(1),
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
  cart: z.array(CartItemSchema).min(1),
});

function getBaseUrl(req: Request) {
  // Prefer an explicit env var so Stripe redirect URLs are stable across proxies/environments.
  const envBaseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL;
  if (envBaseUrl) return envBaseUrl.replace(/\/+$/, "");

  // When invoked from a browser, Origin is usually the most accurate.
  const origin = req.headers.get("origin");
  if (origin) return origin.replace(/\/+$/, "");

  // Fall back to forwarded host/proto (common behind Vercel/NGINX/Cloudflare).
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const forwardedProto = req.headers.get("x-forwarded-proto");

  // `req.url` is generally absolute in Next route handlers; use it as an extra hint.
  const requestUrl = new URL(req.url);

  if (!host) return requestUrl.origin;

  // If proto isn't provided (common in local dev), don't default to https for localhost.
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

function pickUnitPrice(
  product: any,
  sizeIndex: number | null | undefined,
  legacySize: string | null | undefined
) {
  // Try new size_options format first
  if (sizeIndex != null && product.size_options && Array.isArray(product.size_options)) {
    const option = product.size_options[sizeIndex];
    if (option && option.price != null) {
      return Number(option.price);
    }
  }

  // Fallback to legacy fields
  const small =
    product.price_small != null ? Number(product.price_small) : null;
  const medium =
    product.price_medium != null ? Number(product.price_medium) : null;
  const large =
    product.price_large != null ? Number(product.price_large) : null;

  // Legacy index-based (0, 1, 2)
  if (sizeIndex === 0) return small;
  if (sizeIndex === 1) return medium;
  if (sizeIndex === 2) return large;

  // Legacy size keys
  if (legacySize === "small") return small;
  if (legacySize === "medium") return medium;
  if (legacySize === "large") return large;
  
  // Very old format (6, 8, 10)
  if (legacySize === "6") return small;
  if (legacySize === "8") return medium;
  if (legacySize === "10") return large;

  // Fallback: pick first available price
  return small ?? medium ?? large;
}

function getSizeLabel(
  product: any,
  sizeIndex: number | null | undefined,
  providedLabel: string | null | undefined,
  legacySize: string | null | undefined
): string {
  // Use provided label if available
  if (providedLabel) return providedLabel;

  // Try to get from new size_options format
  if (sizeIndex != null && product.size_options && Array.isArray(product.size_options)) {
    const option = product.size_options[sizeIndex];
    if (option && option.label) {
      return option.label;
    }
  }

  // Fallback to legacy label fields
  if (sizeIndex === 0 && product.size_small_label) return product.size_small_label;
  if (sizeIndex === 1 && product.size_medium_label) return product.size_medium_label;
  if (sizeIndex === 2 && product.size_large_label) return product.size_large_label;

  if (legacySize === "small" && product.size_small_label) return product.size_small_label;
  if (legacySize === "medium" && product.size_medium_label) return product.size_medium_label;
  if (legacySize === "large" && product.size_large_label) return product.size_large_label;

  // Return the raw size if we have it
  if (legacySize) return legacySize;

  return "";
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const input = CheckoutRequestSchema.parse(json);

    const stripe = getStripe();
    const supabase = createAdminClient();

    const productIds = Array.from(new Set(input.cart.map((i) => i.id)));

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id,name,price_small,price_medium,price_large,size_small_label,size_medium_label,size_large_label,size_options")
      .in("id", productIds);

    if (productsError) throw productsError;

    const productById = new Map((products ?? []).map((p: any) => [p.id, p]));

    const lineItems: any[] = [];
    const productOrders: any[] = [];
    let total = 0;

    for (const item of input.cart) {
      const product = productById.get(item.id);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.id}` },
          { status: 400 }
        );
      }

      const unitPrice = pickUnitPrice(product, item.sizeIndex ?? null, item.size ?? null);
      if (unitPrice == null || Number.isNaN(unitPrice) || unitPrice <= 0) {
        return NextResponse.json(
          {
            error: `Invalid price for product: ${product.name} (${product.id})`,
          },
          { status: 400 }
        );
      }

      // Convert size to display format (e.g., "6" -> "6 inches")
      // Get size label for Stripe product name
      const label = getSizeLabel(product, item.sizeIndex ?? null, item.sizeLabel ?? null, item.size ?? null);
      const sizeLabel = label ? ` (${label})` : "";
      const unitAmount = toCents(unitPrice);

      lineItems.push({
        price_data: {
          currency: STRIPE_CURRENCY,
          product_data: {
            name: `${product.name}${sizeLabel}`,
          },
          unit_amount: unitAmount,
        },
        quantity: item.quantity,
      });

      total += unitPrice * item.quantity;

      productOrders.push({
        product_id: product.id,
        product_name: product.name,
        size: item.sizeIndex !== undefined ? `index:${item.sizeIndex}` : (item.size ?? null),
        quantity: item.quantity,
        customizations: item.customizations ?? [],
        unit_price: unitPrice,
      });
    }

    const orderId = crypto.randomUUID();

    // Create "pending" order before redirecting to Stripe. Webhook will confirm it.
    const { error: insertError } = await supabase.from("orders").insert({
      id: orderId,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
      price_paid: total,
      product_orders: productOrders,
      delivery_type: input.deliveryType,
      pickup_delivery_time: input.pickupDeliveryTime,
      delivery_address:
        input.deliveryType === "delivery"
          ? (input.deliveryAddress ?? null)
          : null,
      notes: input.notes ?? null,
      status: "pending",
    });

    if (insertError) throw insertError;

    const baseUrl = getBaseUrl(req);

    const successUrl = new URL("/order-success", baseUrl);
    successUrl.searchParams.set("orderId", orderId);

    const cancelUrl = new URL("/checkout", baseUrl);
    cancelUrl.searchParams.set("canceled", "1");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: input.customerEmail,
      success_url: successUrl.toString(),
      cancel_url: cancelUrl.toString(),
      metadata: {
        orderId,
        currency: STRIPE_CURRENCY,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe session created without a redirect URL" },
        { status: 500 }
      );
    }

    // Store the Stripe session id for reconciliation / idempotent webhook handling.
    const { error: sessionIdError } = await supabase
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", orderId);
    // If the database hasn't run migration 006 yet, don't fail checkout.
    if (
      sessionIdError &&
      !isMissingColumnError(sessionIdError, "stripe_session_id")
    ) {
      throw sessionIdError;
    }

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    const message = err?.message ?? "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
