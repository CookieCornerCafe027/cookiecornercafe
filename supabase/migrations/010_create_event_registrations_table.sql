-- Create event registrations table (for paid event checkout)
create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  event_id uuid not null references public.events(id) on delete cascade,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  quantity integer not null check (quantity >= 1 and quantity <= 99),
  price_paid numeric(10,2) not null,
  status text not null default 'pending',
  stripe_session_id text,
  confirmation_email_sent_at timestamp with time zone
);

-- Enable RLS (service role/admin client will bypass)
alter table public.event_registrations enable row level security;

-- Admin (authenticated) can view/manage all registrations.
drop policy if exists "event_registrations_select_auth" on public.event_registrations;
create policy "event_registrations_select_auth"
  on public.event_registrations for select
  to authenticated
  using (true);

drop policy if exists "event_registrations_update_auth" on public.event_registrations;
create policy "event_registrations_update_auth"
  on public.event_registrations for update
  to authenticated
  using (true);


