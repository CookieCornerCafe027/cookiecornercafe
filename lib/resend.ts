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
  // We use the same inbox as both the Resend sender and the internal notification email.
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
