-- Ayurvedic Wellness Centre: the centre's own photos for its therapies.
--
-- The files are in the website (public/treatments/awc/<slug>.jpg), so run this
-- AFTER the site with those files has been deployed. Paadha Abhyangam keeps its
-- current photo (none was sent). The Face Care category uses the centre's
-- face-massage photo.
--
-- Safe to re-run.

BEGIN;

UPDATE public.treatments t
SET hero_image_url = '/treatments/awc/' || t.slug || '.jpg', updated_at = now()
WHERE (t.category_id, t.slug) IN (
  ('cat-face-care', 'mukha-abhyangam'),
  ('cat-face-care', 'mukha-lepam'),
  ('cat-face-care', 'njavara-facial'),
  ('cat-hair-care', 'thalapothichil'),
  ('cat-hair-care', 'siro-abhyangam-thalapothichil'),
  ('cat-hair-care', 'hair-scalp-oil-massage'),
  ('cat-massage', 'head-neck-shoulder-massage'),
  ('cat-massage', 'siro-abhyangam')
)
AND t.hero_image_url IS DISTINCT FROM '/treatments/awc/' || t.slug || '.jpg';

UPDATE public.treatment_categories
SET image_url = '/treatments/awc/mukha-abhyangam.jpg'
WHERE id = 'cat-face-care' AND image_url IS DISTINCT FROM '/treatments/awc/mukha-abhyangam.jpg';

COMMIT;

-- Check: eight rows with /treatments/awc/ photos.
SELECT slug, hero_image_url FROM public.treatments WHERE is_active ORDER BY category_id, sort_order;
