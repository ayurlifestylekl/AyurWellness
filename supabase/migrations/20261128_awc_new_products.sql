-- Two new products — Ayurvedic Wellness Centre (25 Nov 2026), from the centre's
-- product sheets: Ayurpsora Oil (200 ml) and Rose Water (100 ml).
--
-- On sale now at RM79 each, with 90 of each in stock. Stock is added as a
-- "received" stock movement (the trigger updates stock_qty), as for the
-- first five products.
--
-- Photos are in the website (public/products/…): run this after deploying.
-- Safe to re-run: products are added once, and the launch stock only once.

BEGIN;

INSERT INTO public.products (slug, name, short_description, description, category, price_rm, sku, stock_qty, status,
  image_url, ingredients, dosage_instructions, contraindications, tags, allow_backorder, is_bundle)
SELECT 'ayurpsora-oil', 'Ayurpsora Oil',
  'Nourishing care for dry, itchy and scaling skin on the scalp and body',
  'Ayurpsora Oil is a traditional Ayurvedic proprietary formulation designed to provide nourishing care for dry, itchy and scaling skin on the scalp and body. Prepared using time-tested Ayurvedic herbs in a nourishing coconut oil base, this formulation helps soothe skin irritation, moisturise dry and flaky patches, and maintain skin comfort. Inspired by traditional Ayurvedic principles, it combines herbs traditionally valued for their skin-nourishing and protective properties. Net volume 200ml.',
  'skin-care', 79, 'AWC-AYURPSORA-200', 0, 'active',
  '/products/ayurpsora-oil.jpg',
  'Nimba (Neem) – Azadirachta indica, Amalaki (Indian Gooseberry) – Emblica officinalis, Bakuchi (Babchi) – Psoralea corylifolia, Kumari (Aloe Vera) – Aloe vera, Yashtimadhu (Licorice) – Glycyrrhiza glabra, Narikela (Coconut Oil) – Cocos nucifera (base)',
  'Take a sufficient quantity of oil and gently massage it into the affected scalp or skin areas. Leave it on for 30–60 minutes before washing off with a mild cleanser. Use 2–3 times weekly, or as directed by a KKM-registered T&CM Ayurveda Practitioner. For external application only.',
  'For external application only.',
  ARRAY['dry-skin', 'scalp-care', 'skin-care'], false, false
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'ayurpsora-oil' OR sku = 'AWC-AYURPSORA-200');

INSERT INTO public.products (slug, name, short_description, description, category, price_rm, sku, stock_qty, status,
  image_url, ingredients, dosage_instructions, contraindications, tags, allow_backorder, is_bundle)
SELECT 'rose-water', 'Rose Water',
  'Steam-distilled, edible-grade rose water to tone, refresh and soothe',
  'Rose Water by Ayurveda Wellness Centre is a natural, steam-distilled formulation designed to provide gentle hydration and refreshing care for the skin. Suitable for all skin types, it can be incorporated into your daily skincare routine to help tone the face, soothe tired and puffy-looking eyes, and soften the palms. Carefully prepared through the traditional steam distillation process, this edible-grade rose water is a versatile addition to your beauty routine: a facial toner, a soothing eye compress, or a natural base for preparing face masks. Net volume 100ml.',
  'skin-care', 79, 'AWC-ROSEWATER-100', 0, 'active',
  '/products/rose-water.jpg',
  'Steam-distilled edible-grade rose water',
  'As a hydrating toner: pour a few drops onto a cotton pad and gently swipe across your face and neck, or spritz directly onto clean skin. As a base for face masks: use rose water instead of plain water to mix your face mask powder into a smooth paste. For tired eyes: soak two cotton pads in chilled rose water and place them over closed eyelids for 5–10 minutes. For softening palms: apply a little to your palms as part of your daily routine. For external application.',
  'For external application.',
  ARRAY['toner', 'skin-care', 'face-mask'], false, false
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'rose-water' OR sku = 'AWC-ROSEWATER-100');

-- Launch stock: 90 each, added once.
INSERT INTO public.stock_movements (product_id, movement_type, quantity_delta, reason, notes)
SELECT p.id, 'received', 90, 'launch_stock', 'Launch stock (90 units)'
FROM public.products p
WHERE p.sku IN ('AWC-AYURPSORA-200', 'AWC-ROSEWATER-100')
  AND NOT EXISTS (SELECT 1 FROM public.stock_movements m WHERE m.product_id = p.id AND m.reason = 'launch_stock');

COMMIT;

-- Check: two rows, RM79, 90 in stock, active.
SELECT name, price_rm, stock_qty, status, image_url FROM public.products WHERE slug IN ('ayurpsora-oil', 'rose-water');
