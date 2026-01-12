-- Add flexible size_options field to support arbitrary number of sizes
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS size_options jsonb DEFAULT '[]'::jsonb;

-- Add helpful comment
COMMENT ON COLUMN public.products.size_options IS 'Array of size options with label and price: [{"label": "6 inches", "price": 28.00}, {"label": "8 inches", "price": 38.00}]';

-- Migrate existing data from old fields to new format
UPDATE public.products
SET size_options = (
  SELECT jsonb_agg(size_option)
  FROM (
    SELECT jsonb_build_object('label', size_small_label, 'price', price_small) as size_option
    WHERE price_small IS NOT NULL
    UNION ALL
    SELECT jsonb_build_object('label', size_medium_label, 'price', price_medium) as size_option
    WHERE price_medium IS NOT NULL
    UNION ALL
    SELECT jsonb_build_object('label', size_large_label, 'price', price_large) as size_option
    WHERE price_large IS NOT NULL
  ) sizes
)
WHERE price_small IS NOT NULL OR price_medium IS NOT NULL OR price_large IS NOT NULL;

-- Note: We keep the old fields for backward compatibility
-- They can be deprecated later once all systems are migrated

