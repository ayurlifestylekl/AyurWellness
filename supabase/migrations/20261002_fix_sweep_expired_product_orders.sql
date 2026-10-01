-- Fix: sweep_expired_product_orders() has always failed with
--   column reference "order_number" is ambiguous
--
-- The function RETURNS TABLE (order_id, order_number), which makes those two
-- names plpgsql variables for the whole body. The loop's
--   SELECT id, order_number FROM product_orders
-- then had two things called order_number to choose between, and Postgres
-- refuses to guess. The daily /api/cron/product-order-expiry job therefore
-- returned 500 every run, so shop orders left awaiting payment were never
-- cancelled and their reserved stock was never released.
--
-- Same signature, same behaviour; the only change is that the table's columns
-- are qualified with an alias so they can't collide with the output columns.

CREATE OR REPLACE FUNCTION public.sweep_expired_product_orders(p_timeout INTERVAL DEFAULT INTERVAL '24 hours')
RETURNS TABLE (order_id UUID, order_number TEXT) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_order RECORD;
BEGIN
  FOR v_order IN
    SELECT po.id AS id, po.order_number AS order_no
    FROM public.product_orders po
    WHERE po.status = 'awaiting_payment'
      AND po.payment_expires_at IS NOT NULL
      AND po.payment_expires_at < now()
    FOR UPDATE OF po
  LOOP
    PERFORM public.release_stock_for_product_order(v_order.id);

    UPDATE public.product_orders AS upo
    SET status = 'cancelled',
        payment_status = 'failed',
        cancelled_at = now(),
        cancel_reason = 'Payment deadline expired'
    WHERE upo.id = v_order.id;

    order_id := v_order.id;
    order_number := v_order.order_no;
    RETURN NEXT;
  END LOOP;
END $$;
