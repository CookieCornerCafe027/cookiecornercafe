-- Add fields used for Stripe reconciliation + idempotent email sending
alter table if exists public.orders
  add column if not exists stripe_session_id text;

alter table if exists public.orders
  add column if not exists confirmation_email_sent_at timestamp with time zone;




