-- Add flexible group pricing options to events
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS pricing_options jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.events.pricing_options IS
'Flexible event pricing options, e.g. [{"label":"1 Person","price":60},{"label":"2 People","price":100}]';
