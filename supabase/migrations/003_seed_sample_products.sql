-- Seed sample crepe cake products
insert into public.products (name, description, price_small, price_medium, price_large, category, customizations) values
  ('Matcha Strawberry Crepe Cake', 'Layers of delicate matcha crepes with fresh strawberries and whipped cream', 28.00, 38.00, 48.00, 'crepe-cake', ARRAY['Extra strawberries', 'Matcha drizzle', 'Gold leaf']),
  ('Classic Vanilla Crepe Cake', 'Traditional French crepe cake with vanilla pastry cream', 25.00, 35.00, 45.00, 'crepe-cake', ARRAY['Fresh berries', 'Chocolate drizzle', 'Edible flowers']),
  ('Chocolate Hazelnut Crepe Cake', 'Rich chocolate crepes layered with hazelnut cream', 30.00, 40.00, 50.00, 'crepe-cake', ARRAY['Crushed hazelnuts', 'Chocolate shavings', 'Caramel drizzle']),
  ('Cookies & Cream Crepe Cake', 'Vanilla crepes with cookies and cream filling', 28.00, 38.00, 48.00, 'crepe-cake', ARRAY['Extra cookie crumbles', 'Oreo topping', 'White chocolate']),
  ('Strawberry Shortcake Cookies', 'Soft cookies with strawberry cream filling', 15.00, null, null, 'cookie', ARRAY['Extra sprinkles', 'Gift wrapping']),
  ('Chocolate Chip Cookies', 'Classic chocolate chip cookies baked fresh daily', 12.00, null, null, 'cookie', ARRAY['Extra chocolate', 'Gift wrapping'])
on conflict do nothing;
