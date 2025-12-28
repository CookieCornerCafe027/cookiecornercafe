import "server-only";

import { Resend } from "resend";

let resend: Resend | null = null;

export function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  if (!resend) {
    resend = new Resend(apiKey);
  }

  return resend;
}

export function getResendFrom() {
  // Resend accepts either a plain email (e.g. orders@yourdomain.com) or a display-name format
  // (e.g. "Cookie Corner Cafe <orders@yourdomain.com>").
  const from = process.env.ORDER_NOTIFICATION_EMAIL;
  if (!from) {
    throw new Error(
      "Missing ORDER_NOTIFICATION_EMAIL (used as Resend sender address)"
    );
  }
  return from;
}

export function getAdminNotificationEmails() {
  // Default admin inbox (requested): hello@cookiecornercafe.ca
  // You can override (or provide multiple) via:
  //   ADMIN_NOTIFICATION_EMAILS="hello@cookiecornercafe.ca,other@domain.com"
  const raw =
    process.env.ADMIN_NOTIFICATION_EMAILS?.trim() ||
    "hello@cookiecornercafe.ca";
  const emails = raw
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  return emails.length ? emails : ["hello@cookiecornercafe.ca"];
}
