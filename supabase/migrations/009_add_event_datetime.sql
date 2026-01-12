-- Add datetime fields to events
alter table public.events
  add column if not exists starts_at timestamp with time zone,
  add column if not exists ends_at timestamp with time zone;

comment on column public.events.starts_at is 'Event start date/time (timestamptz).';
comment on column public.events.ends_at is 'Event end date/time (timestamptz), optional.';




