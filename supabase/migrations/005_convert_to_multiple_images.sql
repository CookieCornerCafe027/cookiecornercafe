-- Convert image_url to image_urls (array of text)
-- First, create the new column
alter table public.products 
  add column if not exists image_urls text[];

-- Migrate existing data: convert single image_url to array
update public.products 
  set image_urls = array[image_url]
  where image_url is not null and image_urls is null;

-- Drop the old column
alter table public.products 
  drop column if exists image_url;

-- Add a comment for documentation
comment on column public.products.image_urls is 'Array of image URLs for the product. First image is the primary/featured image.';


