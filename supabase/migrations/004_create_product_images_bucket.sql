-- Create storage bucket for product images
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- RLS is already enabled on storage.objects by Supabase

-- Drop existing policies if they exist (for re-running migration)
drop policy if exists "product_images_select_public" on storage.objects;
drop policy if exists "product_images_insert_auth" on storage.objects;
drop policy if exists "product_images_update_auth" on storage.objects;
drop policy if exists "product_images_delete_auth" on storage.objects;

-- Allow public to view images
create policy "product_images_select_public"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Only authenticated users can upload images (admin functionality)
create policy "product_images_insert_auth"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

-- Only authenticated users can update images
create policy "product_images_update_auth"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images');

-- Only authenticated users can delete images
create policy "product_images_delete_auth"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');

