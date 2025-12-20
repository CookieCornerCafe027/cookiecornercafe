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
  const websiteUrl = "https://cookiecornercafe.ca";
  const instagramHandle = "cookie_cornercafe";
  const instagramUrl = `https://instagram.com/${instagramHandle}`;
  const logoUrl = "https://cookiecornercafe.ca/android-chrome-192x192.png";

  // Base64 Globe Icon for Website
  const globeIconBase64 =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAABy0lEQVR4nO2Vv0vDQRSFv6S1SUpAsS6CInZpEMWpCIid7Iid/As6iX9AJ3XpLOrgIunSwaEIdXByEAdBByuIdXByUHCpS96ToS8pSdrS6pIOfuFw793v3r1338ckSUKSlS6wA+wAh8AR8ATcg8qOAt88O6U8U9uAnH9LAb2v8Y6rR8AdkAHeK7Xl656O7oEq0AVmY8Y7rQvMA0uA6y2AnUoD69YlXpE6wDLQD27Yf6A3fD8BfN8D9mB/fA3Ym9FhM38U9pI/YQ+oY98R28MvCrtPH7CH9DHwDrsV2L3A7tNfS4F9KLAXAnsqsA8E9lRgTwX2qcDqBfb5D+w/1j8S2Isf2A7Y6wS2A/YugfVgeyrA7mB7KrB76p6C6p8E7K4C7IK6n6O8v6O8S2B7KrB76p6C6p8E7K4C7IK6n6O8v6O8S2B7KrB76p6C6p8E7K4C7IK6n6O8v6O8S2B7KrB76p6C6p8E7K4C7IK6n6O8v6O8S2B7KrB76p6C6p8E7K4C7IK6n6O8v6O8S2B7KrB76p6C6p8E7K4C7IK6n6O8v6O8S2B7KrB76p6C6p8E7K4C7IK6n6O8v6O8S2B7KrB76p6C6p8E7K4C7IK6n6O8v6O8/wH6L7EfgL0P/AAAAABJRU5ErkJggg==";

  // Base64 Instagram Icon
  const instagramIconBase64 =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAABmElEQVR4nO2Vv0vDUBDHv0mrlSqiOIsIDm6C4uYf0En9Ax06uVgnR0cn/QOdunQIdXBy6CIIdXByEAdBB6uIdXBykL70PQ76kpKkLa0u6eAXDve9977v3r1338ckSUKSlS6wA+wAh8AR8ATcg8qOAt88O6U8U9uAnH9LAb2v8Y6rR8AdkAHeK7Xl656O7oEq0AVmY8Y7rQvMA0uA6y2AnUoD69YlXpE6wDLQD27Yf6A3fD8BfN8D9mB/fA3Ym9FhM38U9pI/YQ+oY98R28MvCrtPH7CH9DHwDrsV2L3A7tNfS4F9KLAXAnsqsA8E9lRgTwX2qcDqBfb5D+w/1j8S2Isf2A7Y6wS2A/YugfVgeyrA7mB7KrB76p6C6p8E7K4C7IK6n6O8v6O8S2B7KrB76p6C6p8E7K4C7IK6n6O8v6O8S2B7KrB76p6C6p8E7K4C7IK6n6O8v6O8S2B7KrB76p6C6p8E7K4C7IK6n6O8v6O8S2B7KrB76p6C6p8E7K4C7IK6n6O8v6O8S2B7KrB76p6C6p8E7K4C7IK6n6O8v6O8S2B7KrB76p6C6p8E7K4C7IK6n6O8v6O8S2B7KrB76p6C6p8E7K4C7IK6n6O8v6O8S2B7KrB76p6C6p8E7K4C7IK6n6O8v6O8S2B7KrB76p6C6p8E7K4C7IK6n6O8v6O8S2B7KrB76p6C6p8E7K4C7IK6n6O8v6O8/wH6L7EfgL0P/AAAAABJRU5ErkJggg==";

  // Brand colors (from `app/globals.css`)
  const brand = {
    bg: "#fcd9e5", // --background
    text: "#3d2315", // --foreground
    muted: "#6b5447", // --muted-foreground
    border: "#f5d5dd", // --border
    secondary: "#ffb6c9", // --secondary
    accent: "#ffd4e0", // --accent
    card: "#ffffff",
  } as const;

  const itemsRowsHtml =
    items.length > 0
      ? items
          .map((i) => {
            const name = escapeHtml(i.product_name ?? "Item");
            const qty = i.quantity ?? 1;
            const size = i.size
              ? ` <span style="color:${brand.muted};">(${escapeHtml(String(i.size))})</span>`
              : "";
            const custom =
              i.customizations && i.customizations.length
                ? `<div style="margin-top:4px;color:${brand.muted};font-size:12px;line-height:1.4;">Customizations: ${escapeHtml(
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
                <td style="padding:12px 0;border-top:1px solid ${brand.border};">
                  <div style="font-weight:700;color:${brand.text};font-size:14px;line-height:1.35;">
                    ${name}${size}
                  </div>
                  ${custom}
                </td>
                <td align="right" style="padding:12px 0;border-top:1px solid ${brand.border};color:${brand.text};font-size:14px;white-space:nowrap;">
                  ${qty}
                </td>
                <td align="right" style="padding:12px 0;border-top:1px solid ${brand.border};color:${brand.text};font-size:14px;white-space:nowrap;">
                  ${unit != null ? escapeHtml(formatUsd(unit)) : ""}
                </td>
                <td align="right" style="padding:12px 0;border-top:1px solid ${brand.border};color:${brand.text};font-size:14px;white-space:nowrap;">
                  ${lineTotal != null ? escapeHtml(formatUsd(lineTotal)) : ""}
                </td>
              </tr>
            `.trim();
          })
          .join("")
      : `
          <tr>
            <td colspan="4" style="padding:12px 0;border-top:1px solid ${brand.border};color:${brand.muted};font-size:14px;">
              (No item details available)
            </td>
          </tr>
        `.trim();

  const notesBlock = order.notes
    ? `
        <tr>
          <td style="padding:0 24px 20px 24px;">
            <div style="border:1px solid ${brand.border};border-radius:12px;background:${brand.accent};padding:12px 14px;">
              <div style="font-weight:700;color:${brand.text};font-size:13px;margin:0 0 6px 0;">Notes</div>
              <div style="color:${brand.muted};font-size:13px;line-height:1.45;">${escapeHtml(
                order.notes
              )}</div>
            </div>
          </td>
        </tr>
      `.trim()
    : "";

  const html = `
  <style>
    body, .wrapper { background-color: ${brand.bg} !important; margin: 0 !important; padding: 0 !important; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
  </style>

  <div class="wrapper" style="background-color:${brand.bg};width:100%;margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      Your order is confirmed — ${escapeHtml(isDelivery ? "delivery" : "pickup")} on ${escapeHtml(
        when
      )}.
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${brand.bg};margin:0;padding:0;min-height:100vh;">
      <tr>
        <td align="center" style="padding:60px 12px;background-color:${brand.bg};">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:600px;max-width:600px;background:${brand.card};border:1px solid ${brand.border};border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
            <tr>
              <td style="padding:32px 32px 24px 32px;background:${brand.accent};">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td valign="top" width="44" style="padding:0 12px 0 0;">
                    <img src="${escapeHtml(
                      logoUrl
                    )}" width="44" height="44" alt="Cookie Corner Cafe" style="display:block;border:0;outline:none;text-decoration:none;border-radius:12px;" />
                  </td>
                  <td valign="top">
                    <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:${brand.text};font-weight:900;letter-spacing:0.2px;font-size:16px;">
                      Cookie Corner Cafe
                    </div>
                    <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:${brand.text};font-weight:900;font-size:26px;line-height:1.15;margin-top:6px;">
                      Order confirmed
                    </div>
                    <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:${brand.muted};font-size:14px;line-height:1.45;margin-top:8px;">
                      Thanks, ${escapeHtml(
                        order.customer_name
                      )} — your payment was successful. We’ll start prepping your treats.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px 6px 32px;">
              <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:${brand.text};font-weight:800;font-size:16px;margin:0 0 12px 0;">
                Order details
              </div>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid ${brand.border};border-radius:12px;background:${brand.card};">
                <tr>
                  <td style="padding:12px 14px;border-bottom:1px solid ${brand.border};font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:13px;color:${brand.muted};">
                    Order ID
                  </td>
                  <td align="right" style="padding:12px 14px;border-bottom:1px solid ${brand.border};font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:13px;color:${brand.text};font-weight:700;">
                    ${escapeHtml(order.id)}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 14px;border-bottom:1px solid ${brand.border};font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:13px;color:${brand.muted};">
                    ${escapeHtml(isDelivery ? "Delivery time" : "Pickup time")}
                  </td>
                  <td align="right" style="padding:12px 14px;border-bottom:1px solid ${brand.border};font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:13px;color:${brand.text};font-weight:700;">
                    ${escapeHtml(when)}
                  </td>
                </tr>
                ${
                  isDelivery
                    ? `
                        <tr>
                          <td style="padding:12px 14px;border-bottom:1px solid ${brand.border};font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:13px;color:${brand.muted};">
                            Delivery address
                          </td>
                          <td align="right" style="padding:12px 14px;border-bottom:1px solid ${brand.border};font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:13px;color:${brand.text};font-weight:700;">
                            ${escapeHtml(order.delivery_address ?? "—")}
                          </td>
                        </tr>
                      `.trim()
                    : ""
                }
                <tr>
                  <td style="padding:12px 14px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:13px;color:${brand.muted};">
                    Total paid
                  </td>
                  <td align="right" style="padding:12px 14px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:13px;color:${brand.text};font-weight:900;">
                    $${escapeHtml(total)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px 8px 32px;">
              <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:${brand.text};font-weight:800;font-size:16px;margin:0 0 12px 0;">
                Items
              </div>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding:0 0 10px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid ${brand.border};">
                      <tr>
                        <td style="padding:10px 0 8px 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:12px;color:${brand.muted};font-weight:800;text-transform:uppercase;letter-spacing:0.06em;">
                          Item
                        </td>
                        <td align="right" style="padding:10px 0 8px 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:12px;color:${brand.muted};font-weight:800;text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap;">
                          Qty
                        </td>
                        <td align="right" style="padding:10px 0 8px 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:12px;color:${brand.muted};font-weight:800;text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap;">
                          Unit
                        </td>
                        <td align="right" style="padding:10px 0 8px 0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:12px;color:${brand.muted};font-weight:800;text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap;">
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

          ${
            order.notes
              ? `
                <tr>
                  <td style="padding:0 32px 24px 32px;">
                    <div style="border:1px solid ${brand.border};border-radius:12px;background:${brand.accent};padding:14px 16px;">
                      <div style="font-weight:700;color:${brand.text};font-size:13px;margin:0 0 6px 0;">Notes</div>
                      <div style="color:${brand.muted};font-size:13px;line-height:1.45;">${escapeHtml(
                        order.notes
                      )}</div>
                    </div>
                  </td>
                </tr>
              `.trim()
              : ""
          }

          <tr>
            <td style="padding:16px 32px 0 32px;border-top:1px solid ${brand.border};">
              <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:${brand.text};font-weight:800;font-size:16px;margin:0 0 12px 0;">
                What happens next
              </div>
              <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:${brand.muted};font-size:13px;line-height:1.6;">
                <div style="margin:0 0 8px 0;"><strong style="color:${brand.text};">${escapeHtml(
                  isDelivery ? "Delivery" : "Pickup"
                )}:</strong> ${escapeHtml(
                  isDelivery
                    ? "We’ll prepare your order and bring it to the delivery address at your scheduled time."
                    : "We’ll prepare your order for pickup at your scheduled time."
                )}</div>
                <div style="margin:0 0 8px 0;"><strong style="color:${brand.text};">Need to update something?</strong> Reply to this email and include your Order ID.</div>
                <div style="margin:0;"><strong style="color:${brand.text};">Want more treats?</strong> Browse seasonal specials and place another order anytime.</div>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 32px 16px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:12px;">
                    <a href="${escapeHtml(
                      websiteUrl
                    )}" style="display:inline-block;background:${brand.secondary};color:${brand.text};text-decoration:none;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-weight:800;font-size:13px;line-height:1;border-radius:999px;padding:14px 20px;">
                      <img src="${globeIconBase64}" width="14" height="14" style="display:inline-block;vertical-align:middle;margin-right:6px;border:0;" alt="" />
                      Visit our website
                    </a>
                  </td>
                  <td>
                    <a href="${escapeHtml(
                      instagramUrl
                    )}" style="display:inline-block;background:${brand.accent};color:${brand.text};text-decoration:none;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-weight:800;font-size:13px;line-height:1;border:1px solid ${brand.border};border-radius:999px;padding:14px 20px;">
                      <img src="${instagramIconBase64}" width="14" height="14" style="display:inline-block;vertical-align:middle;margin-right:6px;border:0;" alt="" />
                      Follow @${escapeHtml(instagramHandle)}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:12px 32px 40px 32px;">
              <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:${brand.muted};font-size:12px;line-height:1.6;">
                Links:
                <a href="${escapeHtml(
                  websiteUrl
                )}" style="color:${brand.text};text-decoration:underline;">cookiecornercafe.ca</a>
                &nbsp;•&nbsp;
                <a href="${escapeHtml(
                  instagramUrl
                )}" style="color:${brand.text};text-decoration:underline;">@${escapeHtml(
                  instagramHandle
                )}</a>
              </div>
              <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#9ca3af;font-size:12px;line-height:1.6;margin-top:8px;">
                Cookie Corner Cafe — made with care, baked with love.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  </div>
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
    "What happens next:",
    isDelivery
      ? "- Delivery: We’ll prepare your order and bring it to the delivery address at your scheduled time."
      : "- Pickup: We’ll prepare your order for pickup at your scheduled time.",
    "- Need to update something? Reply to this email and include your Order ID.",
    "",
    "Links:",
    `Website: ${websiteUrl}`,
    `Instagram: @${instagramHandle} (${instagramUrl})`,
    "",
    "Questions? Reply to this email.",
  ];

  return { subject, html, text: textLines.join("\n") };
}
