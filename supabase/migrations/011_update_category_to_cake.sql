-- Update category from 'crepe-cake' to 'cake'
UPDATE public.products
SET category = 'cake'
WHERE category = 'crepe-cake';

-- Update the default value for future inserts
ALTER TABLE public.products 
ALTER COLUMN category SET DEFAULT 'cake';

