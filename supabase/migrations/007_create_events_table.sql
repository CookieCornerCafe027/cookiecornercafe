-- Create events table
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  image_urls text[],
  price_per_entry numeric(10,2) not null,
  capacity integer,
  location text,
  is_active boolean default true
);

comment on column public.events.image_urls is 'Array of image URLs for the event. First image is the primary/featured image.';

-- Enable RLS
alter table public.events enable row level security;

-- Allow everyone to view active events
drop policy if exists "events_select_public" on public.events;
create policy "events_select_public"
  on public.events for select
  using (is_active = true);

-- Authenticated users (admin) can view all events (including inactive)
drop policy if exists "events_select_auth" on public.events;
create policy "events_select_auth"
  on public.events for select
  to authenticated
  using (true);

-- Only authenticated users can insert events (admin functionality)
drop policy if exists "events_insert_auth" on public.events;
create policy "events_insert_auth"
  on public.events for insert
  to authenticated
  with check (true);

-- Only authenticated users can update events
drop policy if exists "events_update_auth" on public.events;
create policy "events_update_auth"
  on public.events for update
  to authenticated
  using (true);

-- Only authenticated users can delete events
drop policy if exists "events_delete_auth" on public.events;
create policy "events_delete_auth"
  on public.events for delete
  to authenticated
  using (true);


