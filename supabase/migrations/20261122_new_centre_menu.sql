-- New centre menu — Ayurvedic Wellness Centre (client list, 22 Nov 2026).
--
-- 1. Adds the nine treatments the centre offers now, with the centre's names,
--    durations and prices. Each copies its photo and booking settings from the
--    closest existing therapy. Same content as src/data/treatments.ts.
-- 2. Hides every other treatment (is_active = false). Nothing is deleted:
--    to offer one again, set is_active = true and add it to
--    OFFERED_TREATMENT_IDS in src/data/treatments.ts.
--
-- Safe to re-run. Generated from src/data/treatments.ts.

BEGIN;

INSERT INTO public.treatments (category_id, slug, title, duration, description, price_rm, price_label, booking_type, requires_consultation, sanskrit_name, benefits, procedure_steps, contraindications, body, hero_image_url, booking_lead_time_hours, requires_scalp_disclaimer, requires_health_intake, minimum_age, special_tags, sort_order, is_active)
SELECT 'cat-face-care', 'mukha-abhyangam', 'Mukha Abhyangam (Face Massage)', '45 min', 'Gentle Ayurvedic facial massage to improve blood circulation, relax facial muscles and promote a natural glow.', 95, NULL, 'direct', false, 'मुख अभ्यङ्ग · Mukha Abhyanga', ARRAY['Improves blood circulation to the face', 'Relaxes tight facial muscles', 'Promotes a natural, healthy glow', 'Calms the mind and eases stress']::text[], '[{"title":"Warm oil application","description":"Warm herbal oil is applied across the face, neck and shoulders."},{"title":"Marma-point massage","description":"Gentle rhythmic strokes and light pressure stimulate the marma points and circulation."},{"title":"Relaxing finish","description":"The session settles into a soothing close as the oil absorbs."}]'::jsonb, 'Avoid if you have active inflammatory acne breakouts, open wounds, skin infections, a high fever, or immediately after cosmetic procedures or chemical peels.', 'Mukha Abhyangam is a gentle Ayurvedic facial massage using warm herbal oil chosen for your skin. Slow, rhythmic strokes and light pressure on the marma points of the face, neck and shoulders improve blood circulation and relax the facial muscles.

Over 45 unhurried minutes the skin is nourished and refreshed, leaving a natural, healthy glow and a calm, rested feeling.',
       base.hero_image_url, base.booking_lead_time_hours, COALESCE(base.requires_scalp_disclaimer, false), COALESCE(base.requires_health_intake, false), base.minimum_age, COALESCE(base.special_tags, '{}'), 0, true
FROM (SELECT 1) AS one
LEFT JOIN public.treatments base ON base.category_id = 'cat-face-care' AND base.slug = 'ayurveda-rejuvenating-face-massage'
ON CONFLICT (category_id, slug) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, description = EXCLUDED.description, price_rm = EXCLUDED.price_rm,
  price_label = NULL, booking_type = 'direct', requires_consultation = false, sanskrit_name = EXCLUDED.sanskrit_name,
  benefits = EXCLUDED.benefits, procedure_steps = EXCLUDED.procedure_steps, contraindications = EXCLUDED.contraindications,
  body = EXCLUDED.body, hero_image_url = EXCLUDED.hero_image_url, booking_lead_time_hours = EXCLUDED.booking_lead_time_hours,
  sort_order = EXCLUDED.sort_order, is_active = true, updated_at = now();

INSERT INTO public.treatments (category_id, slug, title, duration, description, price_rm, price_label, booking_type, requires_consultation, sanskrit_name, benefits, procedure_steps, contraindications, body, hero_image_url, booking_lead_time_hours, requires_scalp_disclaimer, requires_health_intake, minimum_age, special_tags, sort_order, is_active)
SELECT 'cat-face-care', 'makha-lepham', 'Makha Lepham (Herbal Facial)', '1 Hour 30 min', 'Ayurvedic herbal facial to cleanse, nourish and rejuvenate the skin, helping to improve skin tone and reduce dullness.', 175, NULL, 'direct', false, 'मुख लेपनम् · Mukha Lepanam', ARRAY['Deeply cleanses and refreshes the skin', 'Nourishes and rejuvenates', 'Helps improve skin tone', 'Reduces dullness for a brighter complexion']::text[], '[{"title":"Cleanse & scrub","description":"The face is cleansed and gently exfoliated with a herbal scrub."},{"title":"Oil massage & steam","description":"A medicated oil massage is followed by herbal steam to open the pores."},{"title":"Herbal pack","description":"A nourishing herbal lepa is applied to restore the skin''s vitality."}]'::jsonb, 'Avoid if you have hypersensitive skin reactive to multi-herbal compounds, active severe dermatitis, or any undiagnosed skin conditions.', 'Makha Lepham is a complete Ayurvedic herbal facial. The skin is cleansed, gently exfoliated with a herbal scrub, massaged with medicated oil and steamed with herbs before a nourishing herbal pack (lepa) is applied.

This 90-minute ritual cleanses, nourishes and rejuvenates the skin, helping to even the skin tone and lift dullness.',
       base.hero_image_url, base.booking_lead_time_hours, COALESCE(base.requires_scalp_disclaimer, false), COALESCE(base.requires_health_intake, false), base.minimum_age, COALESCE(base.special_tags, '{}'), 1, true
FROM (SELECT 1) AS one
LEFT JOIN public.treatments base ON base.category_id = 'cat-face-care' AND base.slug = 'ayurvedic-herbal-facial'
ON CONFLICT (category_id, slug) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, description = EXCLUDED.description, price_rm = EXCLUDED.price_rm,
  price_label = NULL, booking_type = 'direct', requires_consultation = false, sanskrit_name = EXCLUDED.sanskrit_name,
  benefits = EXCLUDED.benefits, procedure_steps = EXCLUDED.procedure_steps, contraindications = EXCLUDED.contraindications,
  body = EXCLUDED.body, hero_image_url = EXCLUDED.hero_image_url, booking_lead_time_hours = EXCLUDED.booking_lead_time_hours,
  sort_order = EXCLUDED.sort_order, is_active = true, updated_at = now();

INSERT INTO public.treatments (category_id, slug, title, duration, description, price_rm, price_label, booking_type, requires_consultation, sanskrit_name, benefits, procedure_steps, contraindications, body, hero_image_url, booking_lead_time_hours, requires_scalp_disclaimer, requires_health_intake, minimum_age, special_tags, sort_order, is_active)
SELECT 'cat-face-care', 'njavara-facial', 'Njavara Facial (Milk Facial)', '1 Hour 30 min', 'Nourishing milk facial to hydrate, soften and brighten the skin, leaving it smooth and radiant.', 185, NULL, 'direct', false, 'णजवर मुख लेपम् · Njavara Mukha Lepam', ARRAY['Deeply hydrates the skin', 'Softens and smooths the skin texture', 'Brightens the complexion', 'Leaves a smooth, radiant finish']::text[], '[{"title":"Cleanse & scrub","description":"The skin is cleansed and gently exfoliated."},{"title":"Oil massage","description":"A face and neck oil massage prepares the skin."},{"title":"Njavara milk poultice","description":"Warm milk-rice poultices are massaged in as a nourishing mask."},{"title":"Herbal face pack","description":"A finishing herbal pack soothes and brightens the skin."}]'::jsonb, 'Avoid with highly congested skin or active cystic acne, an absolute lactose allergy or sensitivity to external dairy, or during a common cold or sinus congestion.', 'A nourishing classical Ayurvedic facial using Njavara, a medicinal red rice cooked in herbal decoction and milk. Warm poultices of this rich blend are massaged into the face and neck so the skin absorbs its nutrients.

Over 90 comforting minutes the skin is cleansed, gently scrubbed, massaged and finished with a herbal pack, leaving it hydrated, soft, smooth and radiant.',
       -- photo from vyanga-care-pigmentation (the closest therapy's own photo is mismatched on the current site)
       (SELECT p.hero_image_url FROM public.treatments p WHERE p.category_id = 'cat-face-care' AND p.slug = 'vyanga-care-pigmentation'), 48, COALESCE(base.requires_scalp_disclaimer, false), COALESCE(base.requires_health_intake, false), base.minimum_age, COALESCE(base.special_tags, '{}'), 2, true
FROM (SELECT 1) AS one
LEFT JOIN public.treatments base ON base.category_id = 'cat-face-care' AND base.slug = 'njavara-milk-facial'
ON CONFLICT (category_id, slug) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, description = EXCLUDED.description, price_rm = EXCLUDED.price_rm,
  price_label = NULL, booking_type = 'direct', requires_consultation = false, sanskrit_name = EXCLUDED.sanskrit_name,
  benefits = EXCLUDED.benefits, procedure_steps = EXCLUDED.procedure_steps, contraindications = EXCLUDED.contraindications,
  body = EXCLUDED.body, hero_image_url = EXCLUDED.hero_image_url, booking_lead_time_hours = EXCLUDED.booking_lead_time_hours,
  sort_order = EXCLUDED.sort_order, is_active = true, updated_at = now();

INSERT INTO public.treatments (category_id, slug, title, duration, description, price_rm, price_label, booking_type, requires_consultation, sanskrit_name, benefits, procedure_steps, contraindications, body, hero_image_url, booking_lead_time_hours, requires_scalp_disclaimer, requires_health_intake, minimum_age, special_tags, sort_order, is_active)
SELECT 'cat-hair-care', 'thalapothichil', 'Thalapothichil (Scalp Detox Treatment)', '1 Hour 30 min', 'Herbal scalp detox therapy (Thala Pothichil) to cleanse the scalp, remove build-up, reduce heat and promote healthy hair growth.', 165, NULL, 'direct', false, 'तल पोथिचिल् · Thala Pothichil', ARRAY['Cleanses the scalp and removes build-up', 'Reduces heat in the head and body', 'Promotes healthy hair growth', 'Calms the mind and supports restful sleep']::text[], '[{"title":"Scalp preparation","description":"The scalp is prepared with a light application of herbal oil."},{"title":"Herbal paste","description":"A thick paste of fresh herbs is applied evenly over the scalp."},{"title":"Leaf wrap & rest","description":"The head is wrapped with natural leaves and the pack is left to work."},{"title":"Wash","description":"The pack is removed and the scalp and hair are washed clean."}]'::jsonb, 'Not advised if you have an active cold, cough, sinus congestion or a fever, or during the active days of menstruation, as the treatment is deeply cooling. Pregnant women should consult the Vaidya before booking.', 'Thalapothichil is a cooling herbal scalp therapy. A thick paste of fresh herbs is applied over the scalp and wrapped with natural leaves, then left to work while you rest.

The herbal pack draws out build-up, cleanses the scalp and reduces excess heat in the head, creating healthy conditions for the hair to grow.',
       base.hero_image_url, base.booking_lead_time_hours, COALESCE(base.requires_scalp_disclaimer, false), COALESCE(base.requires_health_intake, false), base.minimum_age, COALESCE(base.special_tags, '{}'), 0, true
FROM (SELECT 1) AS one
LEFT JOIN public.treatments base ON base.category_id = 'cat-hair-care' AND base.slug = 'ayurveda-hair-scalp-therapy'
ON CONFLICT (category_id, slug) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, description = EXCLUDED.description, price_rm = EXCLUDED.price_rm,
  price_label = NULL, booking_type = 'direct', requires_consultation = false, sanskrit_name = EXCLUDED.sanskrit_name,
  benefits = EXCLUDED.benefits, procedure_steps = EXCLUDED.procedure_steps, contraindications = EXCLUDED.contraindications,
  body = EXCLUDED.body, hero_image_url = EXCLUDED.hero_image_url, booking_lead_time_hours = EXCLUDED.booking_lead_time_hours,
  sort_order = EXCLUDED.sort_order, is_active = true, updated_at = now();

INSERT INTO public.treatments (category_id, slug, title, duration, description, price_rm, price_label, booking_type, requires_consultation, sanskrit_name, benefits, procedure_steps, contraindications, body, hero_image_url, booking_lead_time_hours, requires_scalp_disclaimer, requires_health_intake, minimum_age, special_tags, sort_order, is_active)
SELECT 'cat-hair-care', 'siro-abhyangam-thalapothichil', 'Siro Abhyangam + Thalapothichil (Hair Treatment)', '1 Hour 30 min', 'A combination of head oil massage (Siro Abhyangam) and herbal pack (Thalapothichil) to nourish the scalp, strengthen hair roots and improve hair texture.', 165, NULL, 'direct', false, 'शिरो अभ्यङ्ग + तल पोथिचिल् · Siro Abhyanga + Thala Pothichil', ARRAY['Nourishes the scalp', 'Strengthens the hair roots', 'Improves hair texture', 'Deeply relaxing for body and mind']::text[], '[{"title":"Siro Abhyangam","description":"A warm herbal-oil massage of the scalp, head and neck."},{"title":"Thalapothichil pack","description":"A herbal paste is applied over the scalp and wrapped with natural leaves."},{"title":"Rest","description":"You rest while the herbal pack works."},{"title":"Wash","description":"The pack is removed and the scalp and hair are washed clean."}]'::jsonb, 'Not advised if you have an active cold, cough, sinus congestion, a scalp infection or a fever, or during the active days of menstruation. Pregnant women should consult the Vaidya before booking.', 'This hair treatment combines two classical therapies. It begins with Siro Abhyangam, a warm herbal-oil massage of the scalp, head and neck, followed by Thalapothichil, a cooling herbal pack applied over the scalp and wrapped with natural leaves.

Together they nourish the scalp, strengthen the hair roots and improve the texture of the hair, while leaving you deeply relaxed.',
       base.hero_image_url, base.booking_lead_time_hours, COALESCE(base.requires_scalp_disclaimer, false), COALESCE(base.requires_health_intake, false), base.minimum_age, COALESCE(base.special_tags, '{}'), 1, true
FROM (SELECT 1) AS one
LEFT JOIN public.treatments base ON base.category_id = 'cat-hair-care' AND base.slug = 'ayurveda-hair-treatment'
ON CONFLICT (category_id, slug) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, description = EXCLUDED.description, price_rm = EXCLUDED.price_rm,
  price_label = NULL, booking_type = 'direct', requires_consultation = false, sanskrit_name = EXCLUDED.sanskrit_name,
  benefits = EXCLUDED.benefits, procedure_steps = EXCLUDED.procedure_steps, contraindications = EXCLUDED.contraindications,
  body = EXCLUDED.body, hero_image_url = EXCLUDED.hero_image_url, booking_lead_time_hours = EXCLUDED.booking_lead_time_hours,
  sort_order = EXCLUDED.sort_order, is_active = true, updated_at = now();

INSERT INTO public.treatments (category_id, slug, title, duration, description, price_rm, price_label, booking_type, requires_consultation, sanskrit_name, benefits, procedure_steps, contraindications, body, hero_image_url, booking_lead_time_hours, requires_scalp_disclaimer, requires_health_intake, minimum_age, special_tags, sort_order, is_active)
SELECT 'cat-hair-care', 'hair-scalp-oil-massage', 'Hair & Scalp Oil Massage', '1 Hour', 'Ayurvedic oil massage for the hair and scalp to improve circulation, relieve tension and support healthy, stronger hair.', 90, NULL, 'direct', false, NULL, ARRAY['Improves blood circulation to the scalp', 'Relieves tension in the head and neck', 'Supports healthy, stronger hair', 'Deeply relaxing and calming']::text[], '[{"title":"Warm oil application","description":"Medicated oil is warmed and applied across the scalp and through the hair."},{"title":"Point massage","description":"Gentle finger and palm massage with focused point work stimulates circulation."},{"title":"Combing","description":"The hair is combed through to spread the oil evenly and relax the scalp."}]'::jsonb, 'This treatment is not suitable if you have a fever, cold or any infection, or any scalp infection. It should not be carried out immediately after eating.', 'A traditional Ayurvedic oil massage for the hair and scalp. Warm medicated oil is worked through the scalp and hair with gentle finger and palm techniques and focused point massage.

It improves circulation to the scalp, relieves tension and helps keep the hair healthy and strong.',
       base.hero_image_url, base.booking_lead_time_hours, COALESCE(base.requires_scalp_disclaimer, false), COALESCE(base.requires_health_intake, false), base.minimum_age, COALESCE(base.special_tags, '{}'), 2, true
FROM (SELECT 1) AS one
LEFT JOIN public.treatments base ON base.category_id = 'cat-hair-care' AND base.slug = 'ayurvedic-scalp-hair-oil-massage'
ON CONFLICT (category_id, slug) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, description = EXCLUDED.description, price_rm = EXCLUDED.price_rm,
  price_label = NULL, booking_type = 'direct', requires_consultation = false, sanskrit_name = EXCLUDED.sanskrit_name,
  benefits = EXCLUDED.benefits, procedure_steps = EXCLUDED.procedure_steps, contraindications = EXCLUDED.contraindications,
  body = EXCLUDED.body, hero_image_url = EXCLUDED.hero_image_url, booking_lead_time_hours = EXCLUDED.booking_lead_time_hours,
  sort_order = EXCLUDED.sort_order, is_active = true, updated_at = now();

INSERT INTO public.treatments (category_id, slug, title, duration, description, price_rm, price_label, booking_type, requires_consultation, sanskrit_name, benefits, procedure_steps, contraindications, body, hero_image_url, booking_lead_time_hours, requires_scalp_disclaimer, requires_health_intake, minimum_age, special_tags, sort_order, is_active)
SELECT 'cat-massage', 'head-neck-shoulder-massage', 'Head, Neck & Shoulder Massage', '1 Hour', 'Relaxing Ayurvedic massage for the head, neck and shoulders to relieve muscle tension, reduce stress and improve sleep quality.', 110, NULL, 'direct', false, NULL, ARRAY['Relieves muscle tension in the neck and shoulders', 'Reduces stress', 'Improves sleep quality', 'Leaves you relaxed and refreshed']::text[], '[{"title":"Warm oil application","description":"Warm herbal oil is applied to the head, neck and shoulders."},{"title":"Head massage","description":"Gentle strokes and point massage relax the scalp."},{"title":"Neck & shoulder work","description":"Firm, rhythmic strokes release tension across the neck and shoulders."},{"title":"Calming finish","description":"The session closes with slow, soothing strokes."}]'::jsonb, 'Please avoid this treatment with acute injuries or inflammation, skin infections or open wounds, a fever or contagious illness, or severe spinal or nerve conditions.', 'A relaxing one-hour Ayurvedic massage for the head, neck and shoulders. Warm herbal oil is worked into the scalp and down through the neck and shoulders with firm, rhythmic strokes that release built-up tension.

It is ideal for anyone who carries stress in the upper body, easing muscle tightness, calming the mind and helping you sleep better.',
       base.hero_image_url, base.booking_lead_time_hours, COALESCE(base.requires_scalp_disclaimer, false), COALESCE(base.requires_health_intake, false), base.minimum_age, COALESCE(base.special_tags, '{}'), 0, true
FROM (SELECT 1) AS one
LEFT JOIN public.treatments base ON base.category_id = 'cat-massage' AND base.slug = 'neck-and-shoulder-massage-with-kizhi'
ON CONFLICT (category_id, slug) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, description = EXCLUDED.description, price_rm = EXCLUDED.price_rm,
  price_label = NULL, booking_type = 'direct', requires_consultation = false, sanskrit_name = EXCLUDED.sanskrit_name,
  benefits = EXCLUDED.benefits, procedure_steps = EXCLUDED.procedure_steps, contraindications = EXCLUDED.contraindications,
  body = EXCLUDED.body, hero_image_url = EXCLUDED.hero_image_url, booking_lead_time_hours = EXCLUDED.booking_lead_time_hours,
  sort_order = EXCLUDED.sort_order, is_active = true, updated_at = now();

INSERT INTO public.treatments (category_id, slug, title, duration, description, price_rm, price_label, booking_type, requires_consultation, sanskrit_name, benefits, procedure_steps, contraindications, body, hero_image_url, booking_lead_time_hours, requires_scalp_disclaimer, requires_health_intake, minimum_age, special_tags, sort_order, is_active)
SELECT 'cat-massage', 'siro-abhyangam', 'Siro Abhyangam (Head Massage)', '30 min', 'Traditional Ayurvedic head massage to relax the mind, reduce headache and improve blood circulation.', 75, NULL, 'direct', false, 'शिरो अभ्यङ्ग · Siro Abhyanga', ARRAY['Relaxes the mind', 'Helps reduce headache', 'Improves blood circulation', 'Nourishes the scalp and hair']::text[], '[{"title":"Warm oil application","description":"Warm herb-infused oil is applied to the scalp."},{"title":"Rhythmic strokes","description":"Gentle, firm strokes work across the scalp."},{"title":"Marma stimulation","description":"Key marma points are activated to soothe the nervous system."}]'::jsonb, 'Please avoid this treatment if you have a fever, cold, flu or heavy cough, a scalp infection or injury, a severe migraine in progress, or heavy indigestion.', 'Siro Abhyangam is a traditional Ayurvedic head massage. Warm herb-infused oil is applied to the scalp and worked in with gentle yet firm rhythmic strokes along the marma points.

In just 30 minutes it relaxes the mind, eases headaches and improves blood circulation to the head.',
       base.hero_image_url, base.booking_lead_time_hours, COALESCE(base.requires_scalp_disclaimer, false), COALESCE(base.requires_health_intake, false), base.minimum_age, COALESCE(base.special_tags, '{}'), 1, true
FROM (SELECT 1) AS one
LEFT JOIN public.treatments base ON base.category_id = 'cat-massage' AND base.slug = 'head-massage'
ON CONFLICT (category_id, slug) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, description = EXCLUDED.description, price_rm = EXCLUDED.price_rm,
  price_label = NULL, booking_type = 'direct', requires_consultation = false, sanskrit_name = EXCLUDED.sanskrit_name,
  benefits = EXCLUDED.benefits, procedure_steps = EXCLUDED.procedure_steps, contraindications = EXCLUDED.contraindications,
  body = EXCLUDED.body, hero_image_url = EXCLUDED.hero_image_url, booking_lead_time_hours = EXCLUDED.booking_lead_time_hours,
  sort_order = EXCLUDED.sort_order, is_active = true, updated_at = now();

INSERT INTO public.treatments (category_id, slug, title, duration, description, price_rm, price_label, booking_type, requires_consultation, sanskrit_name, benefits, procedure_steps, contraindications, body, hero_image_url, booking_lead_time_hours, requires_scalp_disclaimer, requires_health_intake, minimum_age, special_tags, sort_order, is_active)
SELECT 'cat-massage', 'paadha-abhyangam', 'Paadha Abhyangam (Foot Massage)', '45 min', 'Therapeutic Ayurvedic foot massage to stimulate vital points, reduce fatigue and improve overall well-being.', 95, NULL, 'direct', false, 'पाद अभ्यङ्ग · Paada Abhyanga', ARRAY['Stimulates the vital marma points of the feet', 'Reduces fatigue', 'Improves overall well-being', 'Encourages deep relaxation and better sleep']::text[], '[{"title":"Warm oil application","description":"Warm herbal oil is applied to the feet, ankles and lower legs."},{"title":"Rhythmic strokes","description":"Soothing, rhythmic strokes work along the feet and lower legs."},{"title":"Marma stimulation","description":"The marma points of the feet are gently activated."}]'::jsonb, 'Please avoid this treatment if you have active infections or open wounds on the feet or legs, a fever or acute illness, or deep vein thrombosis (DVT).', 'Paadha Abhyangam is a therapeutic Ayurvedic foot massage. Warm herbal oil is worked into the feet, ankles and lower legs, and the marma points of the feet are gently stimulated.

These points are linked to the whole body, so the treatment eases tired feet, reduces fatigue and leaves you with a sense of overall well-being.',
       -- photo from njavara-milk-facial (the closest therapy's own photo is mismatched on the current site)
       (SELECT p.hero_image_url FROM public.treatments p WHERE p.category_id = 'cat-face-care' AND p.slug = 'njavara-milk-facial'), base.booking_lead_time_hours, COALESCE(base.requires_scalp_disclaimer, false), COALESCE(base.requires_health_intake, false), base.minimum_age, COALESCE(base.special_tags, '{}'), 2, true
FROM (SELECT 1) AS one
LEFT JOIN public.treatments base ON base.category_id = 'cat-massage' AND base.slug = 'paada-abhyangam-foot-massage'
ON CONFLICT (category_id, slug) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, description = EXCLUDED.description, price_rm = EXCLUDED.price_rm,
  price_label = NULL, booking_type = 'direct', requires_consultation = false, sanskrit_name = EXCLUDED.sanskrit_name,
  benefits = EXCLUDED.benefits, procedure_steps = EXCLUDED.procedure_steps, contraindications = EXCLUDED.contraindications,
  body = EXCLUDED.body, hero_image_url = EXCLUDED.hero_image_url, booking_lead_time_hours = EXCLUDED.booking_lead_time_hours,
  sort_order = EXCLUDED.sort_order, is_active = true, updated_at = now();

-- Hide everything else (not deleted).
UPDATE public.treatments SET is_active = false, updated_at = now()
WHERE is_active AND (category_id, slug) NOT IN (
  ('cat-face-care', 'mukha-abhyangam'),
  ('cat-face-care', 'makha-lepham'),
  ('cat-face-care', 'njavara-facial'),
  ('cat-hair-care', 'thalapothichil'),
  ('cat-hair-care', 'siro-abhyangam-thalapothichil'),
  ('cat-hair-care', 'hair-scalp-oil-massage'),
  ('cat-massage', 'head-neck-shoulder-massage'),
  ('cat-massage', 'siro-abhyangam'),
  ('cat-massage', 'paadha-abhyangam')
);

COMMIT;

-- Check: should list exactly the nine.
SELECT category_id, title, duration, price_rm FROM public.treatments WHERE is_active ORDER BY category_id, sort_order;

