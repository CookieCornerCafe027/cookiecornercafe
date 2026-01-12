-- Create products table
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  description text,
  price_small numeric(10,2),
  price_medium numeric(10,2),
  price_large numeric(10,2),
  image_url text,
  customizations text[], -- Array of available customizations
  category text default 'cake', -- cake, cookie, pastry, etc
  is_active boolean default true
);

-- Enable RLS
alter table public.products enable row level security;

-- Allow everyone to view active products
create policy "products_select_public"
  on public.products for select
  using (is_active = true);

-- Only authenticated users can insert products (admin functionality)
create policy "products_insert_auth"
  on public.products for insert
  to authenticated
  with check (true);

-- Only authenticated users can update products
create policy "products_update_auth"
  on public.products for update
  to authenticated
  using (true);

-- Only authenticated users can delete products
create policy "products_delete_auth"
  on public.products for delete
  to authenticated
  using (true);
