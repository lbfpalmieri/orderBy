ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_select_products ON public.products;
DROP POLICY IF EXISTS anon_insert_products ON public.products;
DROP POLICY IF EXISTS anon_update_products ON public.products;
DROP POLICY IF EXISTS anon_delete_products ON public.products;
DROP POLICY IF EXISTS authenticated_all_products ON public.products;

CREATE POLICY anon_select_products ON public.products
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY anon_insert_products ON public.products
FOR INSERT TO anon, authenticated
WITH CHECK (public.check_admin_password());

CREATE POLICY anon_update_products ON public.products
FOR UPDATE TO anon, authenticated
USING (public.check_admin_password())
WITH CHECK (public.check_admin_password());

CREATE POLICY anon_delete_products ON public.products
FOR DELETE TO anon, authenticated
USING (public.check_admin_password());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon;
GRANT ALL PRIVILEGES ON public.products TO authenticated;
