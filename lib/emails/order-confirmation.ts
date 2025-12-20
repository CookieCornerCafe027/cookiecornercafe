type ProductOrderItem = {
  product_name?: string;
  size?: string | null;
  quantity?: number;
  unit_price?: number;
  customizations?: string[];
};

export type OrderForEmail = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  price_paid: number | string;
  product_orders: ProductOrderItem[] | unknown;
  delivery_type: "pickup" | "delivery" | string;
  pickup_delivery_time: string;
  delivery_address?: string | null;
  notes?: string | null;
};

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatWhen(isoLike: string) {
  const d = new Date(isoLike);
  if (Number.isNaN(d.getTime())) return isoLike;
  return d.toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function renderOrderConfirmationEmail(order: OrderForEmail) {
  const items: ProductOrderItem[] = Array.isArray(order.product_orders)
    ? (order.product_orders as ProductOrderItem[])
    : [];

  const when = formatWhen(order.pickup_delivery_time);
  const isDelivery = order.delivery_type === "delivery";
  const total =
    typeof order.price_paid === "number"
      ? order.price_paid.toFixed(2)
      : String(order.price_paid);

  const subject = "Cookie Corner Cafe — Order confirmed";

  const itemsHtml =
    items.length > 0
      ? `<ul>${items
          .map((i) => {
            const name = escapeHtml(i.product_name ?? "Item");
            const qty = i.quantity ?? 1;
            const size = i.size ? ` (${escapeHtml(String(i.size))})` : "";
            const custom =
              i.customizations && i.customizations.length
                ? `<div style="color:#555;font-size:12px;margin-top:2px;">Customizations: ${escapeHtml(
                    i.customizations.join(", ")
                  )}</div>`
                : "";
            return `<li style="margin:0 0 10px 0;"><div><strong>${qty}×</strong> ${name}${size}</div>${custom}</li>`;
          })
          .join("")}</ul>`
      : "<p>(No item details available)</p>";

  const deliveryBlock = isDelivery
    ? `<p><strong>Delivery address:</strong> ${escapeHtml(
        order.delivery_address ?? ""
      )}</p>`
    : "";

  const notesBlock = order.notes
    ? `<p><strong>Notes:</strong> ${escapeHtml(order.notes)}</p>`
    : "";

  const html = `
  <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;line-height:1.5;color:#111;">
    <h2 style="margin:0 0 8px 0;">Thanks, ${escapeHtml(order.customer_name)}!</h2>
    <p style="margin:0 0 16px 0;">Your payment was successful and your order is confirmed.</p>

    <div style="padding:12px 14px;border:1px solid #e5e7eb;border-radius:10px;margin:0 0 16px 0;">
      <p style="margin:0 0 6px 0;"><strong>Order ID:</strong> ${escapeHtml(order.id)}</p>
      <p style="margin:0 0 6px 0;"><strong>${
        isDelivery ? "Delivery time" : "Pickup time"
      }:</strong> ${escapeHtml(when)}</p>
      ${deliveryBlock}
      <p style="margin:0;"><strong>Total paid:</strong> $${escapeHtml(total)}</p>
    </div>

    <h3 style="margin:0 0 8px 0;">Items</h3>
    ${itemsHtml}

    ${notesBlock}

    <p style="margin:16px 0 0 0;color:#555;font-size:12px;">
      If you have any questions, reply to this email.
    </p>
  </div>
  `.trim();

  const textLines = [
    `Thanks, ${order.customer_name}!`,
    "",
    "Your payment was successful and your order is confirmed.",
    "",
    `Order ID: ${order.id}`,
    `${isDelivery ? "Delivery time" : "Pickup time"}: ${when}`,
    ...(isDelivery && order.delivery_address
      ? [`Delivery address: ${order.delivery_address}`]
      : []),
    `Total paid: $${total}`,
    "",
    "Items:",
    ...(items.length
      ? items.map((i) => {
          const qty = i.quantity ?? 1;
          const size = i.size ? ` (${String(i.size)})` : "";
          const custom =
            i.customizations && i.customizations.length
              ? ` [${i.customizations.join(", ")}]`
              : "";
          return `- ${qty}× ${i.product_name ?? "Item"}${size}${custom}`;
        })
      : ["- (No item details available)"]),
    ...(order.notes ? ["", `Notes: ${order.notes}`] : []),
  ];

  return { subject, html, text: textLines.join("\n") };
}
