CREATE TABLE IF NOT EXISTS public.order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_key TEXT NOT NULL,
  loja_fallback TEXT NOT NULL,
  text TEXT NOT NULL,
  items_by_loja JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS order_history_workspace_created_at_idx
ON public.order_history (workspace_key, created_at DESC);

ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS deny_anon_select_order_history ON public.order_history;
CREATE POLICY deny_anon_select_order_history ON public.order_history
FOR SELECT TO anon
USING (false);

DROP POLICY IF EXISTS deny_anon_insert_order_history ON public.order_history;
CREATE POLICY deny_anon_insert_order_history ON public.order_history
FOR INSERT TO anon
WITH CHECK (false);

DROP POLICY IF EXISTS deny_anon_update_order_history ON public.order_history;
CREATE POLICY deny_anon_update_order_history ON public.order_history
FOR UPDATE TO anon
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS deny_anon_delete_order_history ON public.order_history;
CREATE POLICY deny_anon_delete_order_history ON public.order_history
FOR DELETE TO anon
USING (false);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_history TO anon;

CREATE OR REPLACE FUNCTION public.save_order_history(
  p_workspace_key TEXT,
  p_loja_fallback TEXT,
  p_text TEXT,
  p_items_by_loja JSONB,
  p_created_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_id UUID;
  new_id UUID;
BEGIN
  IF p_workspace_key IS NULL OR length(trim(p_workspace_key)) < 16 THEN
    RAISE EXCEPTION 'workspace_key inválida';
  END IF;
  IF p_text IS NULL OR length(trim(p_text)) = 0 THEN
    RAISE EXCEPTION 'texto vazio';
  END IF;
  IF p_loja_fallback IS NULL OR length(trim(p_loja_fallback)) = 0 THEN
    RAISE EXCEPTION 'loja_fallback vazio';
  END IF;

  SELECT oh.id INTO existing_id
  FROM public.order_history oh
  WHERE oh.workspace_key = p_workspace_key
    AND oh.text = p_text
    AND abs(extract(epoch from (oh.created_at - p_created_at))) < (12 * 60 * 60)
  ORDER BY oh.created_at DESC
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.order_history (workspace_key, loja_fallback, text, items_by_loja, created_at)
  VALUES (p_workspace_key, p_loja_fallback, p_text, p_items_by_loja, p_created_at)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_order_history(
  p_workspace_key TEXT,
  p_from TIMESTAMPTZ DEFAULT NULL,
  p_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS SETOF public.order_history
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.order_history
  WHERE workspace_key = p_workspace_key
    AND (p_from IS NULL OR created_at >= p_from)
    AND (p_to IS NULL OR created_at <= p_to)
  ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.clear_order_history(
  p_workspace_key TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  IF p_workspace_key IS NULL OR length(trim(p_workspace_key)) < 16 THEN
    RAISE EXCEPTION 'workspace_key inválida';
  END IF;
  DELETE FROM public.order_history WHERE workspace_key = p_workspace_key;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.compact_order_history(
  p_workspace_key TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  IF p_workspace_key IS NULL OR length(trim(p_workspace_key)) < 16 THEN
    RAISE EXCEPTION 'workspace_key inválida';
  END IF;

  DELETE FROM public.order_history older
  USING public.order_history newer
  WHERE older.workspace_key = p_workspace_key
    AND newer.workspace_key = older.workspace_key
    AND newer.text = older.text
    AND newer.created_at > older.created_at
    AND (newer.created_at - older.created_at) < interval '12 hours';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_order_history(TEXT, TEXT, TEXT, JSONB, TIMESTAMPTZ) TO anon;
GRANT EXECUTE ON FUNCTION public.list_order_history(TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO anon;
GRANT EXECUTE ON FUNCTION public.clear_order_history(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.compact_order_history(TEXT) TO anon;

