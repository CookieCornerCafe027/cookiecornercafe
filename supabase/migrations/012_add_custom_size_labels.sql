-- Add custom size label fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS size_small_label text,
ADD COLUMN IF NOT EXISTS size_medium_label text,
ADD COLUMN IF NOT EXISTS size_large_label text;

-- Add helpful comment
COMMENT ON COLUMN public.products.size_small_label IS 'Custom size label for small price (e.g., "6 inches", "7 inches", "Small")';
COMMENT ON COLUMN public.products.size_medium_label IS 'Custom size label for medium price (e.g., "8 inches", "9 inches", "Medium")';
COMMENT ON COLUMN public.products.size_large_label IS 'Custom size label for large price (e.g., "10 inches", "12 inches", "Large")';

