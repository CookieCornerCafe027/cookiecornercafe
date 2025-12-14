import "server-only";

let stripe: any = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  if (!stripe) {
    // Using require avoids TS module-resolution errors before dependencies are installed.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Stripe = require("stripe");
    stripe = new Stripe(secretKey, {
      // Pinning apiVersion is optional; leaving default avoids type/version drift.
      typescript: true,
    });
  }

  return stripe;
}
