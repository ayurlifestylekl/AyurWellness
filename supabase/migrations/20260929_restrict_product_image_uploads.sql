-- Product images may only be written by admins and product managers, which the
-- "Admin writes product images" policy already covers. This older policy let
-- any signed-in customer upload into the public product-images bucket.
DROP POLICY IF EXISTS "storage: authenticated can upload" ON storage.objects;
