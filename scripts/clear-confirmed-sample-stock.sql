-- Owner confirmed these eight original catalogue quantities are sample data on 2026-08-28.
-- This correction is one-time, audited, and never deletes catalogue entries or warehouse records.
BEGIN;
SELECT pg_advisory_xact_lock(826082801);
DO $$
DECLARE
  item RECORD;
  current_product RECORD;
  corrections JSONB := '[]'::jsonb;
BEGIN
  IF EXISTS (SELECT 1 FROM warehouse_audit WHERE action='CLEAR_CONFIRMED_SAMPLE_STOCK' AND entity_id='original-catalogue-2026-08-28') THEN
    RAISE NOTICE 'Sample stock correction already recorded; nothing changed.';
    RETURN;
  END IF;
  FOR item IN SELECT * FROM (VALUES
    ('06H121026DD',6),('06H905115B',24),('31317603',7),('52060398AC',8),
    ('68212327AA',9),('A2048300018',15),('A2711800109',18),('LR061888',4)
  ) AS seeds(part_no,expected_qty) ORDER BY part_no LOOP
    SELECT id,stock INTO current_product FROM products WHERE part_no=item.part_no FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Expected sample part % is missing; manual review required.',item.part_no; END IF;
    IF current_product.stock<>item.expected_qty AND current_product.stock<>0 THEN
      RAISE EXCEPTION 'Stock for % has changed; refusing sample correction.',item.part_no;
    END IF;
    IF EXISTS(SELECT 1 FROM inventory_batches WHERE product_id=current_product.id)
      OR EXISTS(SELECT 1 FROM inventory_movements WHERE product_id=current_product.id)
      OR EXISTS(SELECT 1 FROM order_items WHERE product_id=current_product.id)
      OR EXISTS(SELECT 1 FROM counter_sale_items WHERE product_id=current_product.id) THEN
      RAISE EXCEPTION 'Part % has inventory or sales history; manual review required.',item.part_no;
    END IF;
    corrections := corrections || jsonb_build_array(jsonb_build_object('productId',current_product.id,'partNo',item.part_no,'previousStock',current_product.stock,'correctedStock',0));
    UPDATE products SET stock=0,updated_at=NOW() WHERE id=current_product.id;
  END LOOP;
  INSERT INTO warehouse_audit(action,entity_type,entity_id,details)
    VALUES('CLEAR_CONFIRMED_SAMPLE_STOCK','catalogue','original-catalogue-2026-08-28',jsonb_build_object('reason','Owner confirmed original catalogue quantities are sample data on 2026-08-28','corrections',corrections));
END $$;
COMMIT;
