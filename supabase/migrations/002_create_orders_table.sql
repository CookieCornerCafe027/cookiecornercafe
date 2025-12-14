-- Create orders table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  price_paid numeric(10,2) not null,
  product_orders jsonb not null, -- Array of {product_id, product_name, size, quantity, customizations, price}
  delivery_type text not null check (delivery_type in ('pickup', 'delivery')),
  pickup_delivery_time timestamp with time zone not null,
  delivery_address text,
  status text default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  notes text
);

-- Enable RLS
alter table public.orders enable row level security;

-- Authenticated users (admin) can view all orders
create policy "orders_select_auth"
  on public.orders for select
  to authenticated
  using (true);

-- Anyone can insert orders (customer checkout)
create policy "orders_insert_public"
  on public.orders for insert
  to anon, authenticated
  with check (true);

-- Only authenticated users can update orders
create policy "orders_update_auth"
  on public.orders for update
  to authenticated
  using (true);

-- Only authenticated users can delete orders
create policy "orders_delete_auth"
  on public.orders for delete
  to authenticated
  using (true);
