-- Blueprint Teil 14: merged_into_cart_id Self-Reference für Merge-Tracking
-- Wohin wurde der anonyme Warenkorb verschmolzen?
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'cart_management' AND table_name = 'shopping_carts')
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.table_constraints
       WHERE constraint_schema = 'cart_management' AND table_name = 'shopping_carts'
         AND constraint_name = 'shopping_carts_merged_into_fk'
     ) THEN
    ALTER TABLE cart_management.shopping_carts
      ADD CONSTRAINT shopping_carts_merged_into_fk
      FOREIGN KEY (merged_into_cart_id) REFERENCES cart_management.shopping_carts(cart_id) ON DELETE SET NULL;
  END IF;
END $$;
