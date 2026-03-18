CREATE OR REPLACE FUNCTION public.check_admin_password()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT (
    (COALESCE(NULLIF(current_setting('request.headers', true), ''), '{}')::json ->> 'x-admin-password') = '445'
  );
$$;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_insert_products ON public.products;
CREATE POLICY anon_insert_products ON public.products
FOR INSERT TO anon
WITH CHECK (public.check_admin_password());

DROP POLICY IF EXISTS anon_update_products ON public.products;
CREATE POLICY anon_update_products ON public.products
FOR UPDATE TO anon
USING (public.check_admin_password())
WITH CHECK (public.check_admin_password());

DROP POLICY IF EXISTS anon_delete_products ON public.products;
CREATE POLICY anon_delete_products ON public.products
FOR DELETE TO anon
USING (public.check_admin_password());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon;
GRANT ALL PRIVILEGES ON public.products TO authenticated;
