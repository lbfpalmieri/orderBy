CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  unidade TEXT NOT NULL,
  peso_por_unidade_kg DOUBLE PRECISION NULL,
  tipo_chocolate TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS products_nome_unique_ci ON public.products (lower(nome));

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_select_products ON public.products;
CREATE POLICY anon_select_products ON public.products
FOR SELECT TO anon
USING (true);

DROP POLICY IF EXISTS anon_insert_products ON public.products;
CREATE POLICY anon_insert_products ON public.products
FOR INSERT TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS anon_update_products ON public.products;
CREATE POLICY anon_update_products ON public.products
FOR UPDATE TO anon
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS anon_delete_products ON public.products;
CREATE POLICY anon_delete_products ON public.products
FOR DELETE TO anon
USING (true);

DROP POLICY IF EXISTS authenticated_all_products ON public.products;
CREATE POLICY authenticated_all_products ON public.products
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon;
GRANT ALL PRIVILEGES ON public.products TO authenticated;

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origem TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_select_orders ON public.orders;
CREATE POLICY anon_select_orders ON public.orders
FOR SELECT TO anon
USING (true);

DROP POLICY IF EXISTS anon_insert_orders ON public.orders;
CREATE POLICY anon_insert_orders ON public.orders
FOR INSERT TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS authenticated_all_orders ON public.orders;
CREATE POLICY authenticated_all_orders ON public.orders
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon;
GRANT ALL PRIVILEGES ON public.orders TO authenticated;

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantidade DOUBLE PRECISION NOT NULL
);

ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_order_id_fkey,
  DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON public.order_items(product_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_select_order_items ON public.order_items;
CREATE POLICY anon_select_order_items ON public.order_items
FOR SELECT TO anon
USING (true);

DROP POLICY IF EXISTS anon_insert_order_items ON public.order_items;
CREATE POLICY anon_insert_order_items ON public.order_items
FOR INSERT TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS authenticated_all_order_items ON public.order_items;
CREATE POLICY authenticated_all_order_items ON public.order_items
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO anon;
GRANT ALL PRIVILEGES ON public.order_items TO authenticated;
