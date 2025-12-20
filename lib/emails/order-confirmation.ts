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

function formatUsd(amount: number | null | undefined) {
  if (typeof amount !== "number" || Number.isNaN(amount)) return "";
  return `$${amount.toFixed(2)}`;
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

  const itemsRowsHtml =
    items.length > 0
      ? items
          .map((i) => {
            const name = escapeHtml(i.product_name ?? "Item");
            const qty = i.quantity ?? 1;
            const size = i.size
              ? ` <span style="color:#6b7280;">(${escapeHtml(String(i.size))})</span>`
              : "";
            const custom =
              i.customizations && i.customizations.length
                ? `<div style="margin-top:4px;color:#6b7280;font-size:12px;line-height:1.4;">Customizations: ${escapeHtml(
                    i.customizations.join(", ")
                  )}</div>`
                : "";

            const unit =
              typeof i.unit_price === "number" && !Number.isNaN(i.unit_price)
                ? i.unit_price
                : null;
            const lineTotal = unit != null ? unit * qty : null;

            return `
              <tr>
                <td style="padding:12px 0;border-top:1px solid #efe7dc;">
                  <div style="font-weight:700;color:#2b1d10;font-size:14px;line-height:1.35;">
                    ${name}${size}
                  </div>
                  ${custom}
                </td>
                <td align="right" style="padding:12px 0;border-top:1px solid #efe7dc;color:#2b1d10;font-size:14px;white-space:nowrap;">
                  ${qty}
                </td>
                <td align="right" style="padding:12px 0;border-top:1px solid #efe7dc;color:#2b1d10;font-size:14px;white-space:nowrap;">
                  ${unit != null ? escapeHtml(formatUsd(unit)) : ""}
                </td>
                <td align="right" style="padding:12px 0;border-top:1px solid #efe7dc;color:#2b1d10;font-size:14px;white-space:nowrap;">
                  ${lineTotal != null ? escapeHtml(formatUsd(lineTotal)) : ""}
                </td>
              </tr>
            `.trim();
          })
          .join("")
      : `
          <tr>
            <td colspan="4" style="padding:12px 0;border-top:1px solid #efe7dc;color:#6b7280;font-size:14px;">
              (No item details available)
            </td>
          </tr>
        `.trim();

  const notesBlock = order.notes
    ? `
        <tr>
          <td style="padding:0 24px 20px 24px;">
            <div style="border:1px solid #efe7dc;border-radius:12px;background:#fff7ed;padding:12px 14px;">
              <div style="font-weight:700;color:#2b1d10;font-size:13px;margin:0 0 6px 0;">Notes</div>
              <div style="color:#4b5563;font-size:13px;line-height:1.45;">${escapeHtml(
                order.notes
              )}</div>
            </div>
          </td>
        </tr>
      `.trim()
    : "";

  const html = `
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Your order is confirmed — ${escapeHtml(isDelivery ? "delivery" : "pickup")} on ${escapeHtml(
      when
    )}.
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#fbf7f2;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #efe7dc;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:22px 24px 16px 24px;background:#fff7ed;">
              <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#7c4a1b;font-weight:800;letter-spacing:0.4px;font-size:16px;">
                Cookie Corner Cafe
              </div>
              <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#2b1d10;font-weight:900;font-size:26px;line-height:1.15;margin-top:6px;">
                Order confirmed
              </div>
              <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#4b5563;font-size:14px;line-height:1.45;margin-top:8px;">
                Thanks, ${escapeHtml(order.customer_name)} — your payment was successful. We’ll start prepping your treats.
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 24px 6px 24px;">
              <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#2b1d10;font-weight:800;font-size:16px;margin:0 0 10px 0;">
                Order details
              </div>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #efe7dc;border-radius:12px;background:#ffffff;">
                <tr>
                  <td style="padding:12px 14px;border-bottom:1px solid #efe7dc;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:13px;color:#6b7280;">
                    Order ID
                  </td>
                  <td align="right" style="padding:12px 14px;border-bottom:1px solid #efe7dc;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:13px;color:#2b1d10;font-weight:700;">
                    ${escapeHtml(order.id)}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 14px;border-bottom:1px solid #efe7dc;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:13px;color:#6b7280;">
                    ${escapeHtml(isDelivery ? "Delivery time" : "Pickup time")}
                  </td>
                  <td align="right" style="padding:12px 14px;border-bottom:1px solid #efe7dc;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:13px;color:#2b1d10;font-weight:700;">
                    ${escapeHtml(when)}
                  </td>
                </tr>
                ${
                  isDelivery
                    ? `
                        <tr>
                          <td style="padding:12px 14px;border-bottom:1px solid #efe7dc;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:13px;color:#6b7280;">
                            Delivery address
                          </td>
                          <td align="right" style="padding:12px 14px;border-bottom:1px solid #efe7dc;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:13px;color:#2b1d10;font-weight:700;">
                            ${escapeHtml(order.delivery_address ?? "—")}
                          </td>
                        </tr>
                      `.trim()
                    : ""
                }
                <tr>
                  <td style="padding:12px 14px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:13px;color:#6b7280;">
                    Total paid
                  </td>
                  <td align="right" style="padding:12px 14px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:13px;color:#2b1d10;font-weight:900;">
                    $${escapeHtml(total)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:12px 24px 8px 24px;">
              <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#2b1d10;font-weight:800;font-size:16px;margin:0 0 10px 0;">
                Items
              </div>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding:0 0 10px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #efe7dc;">
                      <tr>
                        <td style="padding:10px 0 8px 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:12px;color:#6b7280;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;">
                          Item
                        </td>
                        <td align="right" style="padding:10px 0 8px 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:12px;color:#6b7280;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap;">
                          Qty
                        </td>
                        <td align="right" style="padding:10px 0 8px 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:12px;color:#6b7280;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap;">
                          Unit
                        </td>
                        <td align="right" style="padding:10px 0 8px 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:12px;color:#6b7280;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap;">
                          Total
                        </td>
                      </tr>
                      ${itemsRowsHtml}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${notesBlock}

          <tr>
            <td style="padding:6px 24px 22px 24px;">
              <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#6b7280;font-size:12px;line-height:1.5;">
                Questions or changes? Just reply to this email and we’ll help out.
              </div>
              <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#9ca3af;font-size:12px;line-height:1.5;margin-top:8px;">
                Cookie Corner Cafe
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  `.trim();

  const textLines = [
    "Cookie Corner Cafe",
    "Order confirmed",
    "",
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
          const unit =
            typeof i.unit_price === "number" && !Number.isNaN(i.unit_price)
              ? formatUsd(i.unit_price)
              : "";
          const lineTotal =
            typeof i.unit_price === "number" && !Number.isNaN(i.unit_price)
              ? formatUsd(i.unit_price * qty)
              : "";
          const pricePart =
            unit || lineTotal
              ? ` — ${[unit, lineTotal].filter(Boolean).join(" / ")}`
              : "";
          return `- ${qty}× ${i.product_name ?? "Item"}${size}${custom}${pricePart}`;
        })
      : ["- (No item details available)"]),
    ...(order.notes ? ["", `Notes: ${order.notes}`] : []),
    "",
    "Questions? Reply to this email.",
  ];

  return { subject, html, text: textLines.join("\n") };
}
