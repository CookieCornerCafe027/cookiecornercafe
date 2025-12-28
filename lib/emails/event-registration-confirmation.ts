export interface EventRegistrationForEmail {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  quantity: number;
  price_paid: number;
  event?: {
    id: string;
    title: string | null;
    starts_at?: string | null;
    location?: string | null;
  } | null;
}

function formatCurrency(amount: number | null | undefined) {
  if (typeof amount !== "number" || Number.isNaN(amount)) return "$0.00";
  return `$${amount.toFixed(2)}`;
}

function formatWhen(start?: string | null) {
  if (!start) return "TBD";
  try {
    const d = new Date(start);
    return d.toLocaleString();
  } catch {
    return String(start);
  }
}

export function renderEventRegistrationEmail(reg: EventRegistrationForEmail) {
  const eventTitle = reg.event?.title ?? "Event";
  const when = formatWhen(reg.event?.starts_at ?? null);
  const location = reg.event?.location ?? "TBD";
  const qty = reg.quantity ?? 1;
  const total = formatCurrency(reg.price_paid);

  const subject = `Cookie Corner Cafe — ${eventTitle} ticket confirmed`;
  const websiteUrl = "https://cookiecornercafe.ca";
  const logoUrl = "https://cookiecornercafe.ca/android-chrome-192x192.png";

  const html = `
  <div style="background:#f8f9fb;padding:24px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.06);">
      <tr>
        <td style="padding:24px 24px 8px;text-align:center;">
          <img src="${logoUrl}" alt="Cookie Corner Cafe" width="64" height="64" style="border-radius:12px;"/>
          <h1 style="margin:12px 0 4px;font-size:22px;">Ticket confirmed</h1>
          <div style="color:#6b7280;font-size:14px;">Thanks, ${reg.customer_name}!</div>
        </td>
      </tr>
      <tr>
        <td style="padding:0 24px 24px;">
          <div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin-top:12px;">
            <div style="font-weight:600;font-size:16px;margin-bottom:8px;">${eventTitle}</div>
            <div style="color:#374151;font-size:14px;line-height:1.5;">
              <div><strong>When:</strong> ${when}</div>
              <div><strong>Location:</strong> ${location}</div>
              <div><strong>Tickets:</strong> ${qty}</div>
              <div><strong>Total paid:</strong> ${total}</div>
              <div style="margin-top:8px;color:#6b7280;font-size:13px;">Registration ID: ${reg.id}</div>
            </div>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:0 24px 24px;">
          <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">
            We’ve received your payment and reserved your spot. If you need to update your details,
            just reply to this email and include your registration ID.
          </p>
          <p style="margin:12px 0 0;color:#6b7280;font-size:13px;">
            See you soon!<br/>Cookie Corner Cafe
          </p>
          <p style="margin:16px 0 0;">
            <a href="${websiteUrl}" style="color:#b91c1c;text-decoration:none;">Visit our site</a>
          </p>
        </td>
      </tr>
    </table>
  </div>
  `.trim();

  const textLines = [
    "Cookie Corner Cafe",
    "Ticket confirmed",
    "",
    `Thanks, ${reg.customer_name}!`,
    "",
    `Event: ${eventTitle}`,
    `When: ${when}`,
    `Location: ${location}`,
    `Tickets: ${qty}`,
    `Total paid: ${total}`,
    `Registration ID: ${reg.id}`,
    "",
    "We’ve received your payment and reserved your spot.",
    "Need to update? Reply with your registration ID.",
    "",
    `Website: ${websiteUrl}`,
  ];

  return { subject, html, text: textLines.join("\n") };
}
