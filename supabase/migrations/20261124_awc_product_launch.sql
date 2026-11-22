-- Product launch — Ayurvedic Wellness Centre (Nov 2026).
--
-- The five AWC products go on sale at RM79 each, shown against a normal price
-- of RM129, with 90 units of each in stock. Online checkout and the counter
-- both charge the sale price (RM79).
--
-- Stock is added as "received" stock movements (the trigger updates
-- stock_qty), so the stock history shows where the 90 came from.
-- Safe to re-run: it only tops stock up to 90, it never adds twice.

BEGIN;

UPDATE public.products
SET price_rm = 129,
    sale_price_rm = 79,
    sale_starts_at = NULL,
    sale_ends_at = NULL,
    status = 'active',
    updated_at = now()
WHERE sku IN ('AWC-DANDRA-200', 'AWC-BALASHWA-200', 'AWC-LAKSHADI-200', 'AWC-HIMASAGARA-200', 'AWC-NALPAMARADI-100');

INSERT INTO public.stock_movements (product_id, movement_type, quantity_delta, reason, notes)
SELECT id, 'received', 90 - stock_qty, 'launch_stock', 'Launch stock (90 units)'
FROM public.products
WHERE sku IN ('AWC-DANDRA-200', 'AWC-BALASHWA-200', 'AWC-LAKSHADI-200', 'AWC-HIMASAGARA-200', 'AWC-NALPAMARADI-100')
  AND stock_qty < 90;

COMMIT;

-- Check: five rows, RM129 / RM79, 90 in stock, active.
SELECT name, price_rm, sale_price_rm, stock_qty, status FROM public.products
WHERE sku LIKE 'AWC-%' ORDER BY name;
