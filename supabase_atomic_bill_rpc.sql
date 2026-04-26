-- Atomic bill create/update RPC for Roomie.
-- Run after supabase_rls_policies.sql.

CREATE OR REPLACE FUNCTION public.save_bill(
  p_bill_id text,
  p_group_id text,
  p_title text,
  p_category text,
  p_amount numeric,
  p_date text,
  p_payers jsonb,
  p_split_among text[],
  p_is_update boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  payer RECORD;
  split_user text;
  payer_sum numeric;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF NOT private.check_group_membership(p_group_id) THEN
    RAISE EXCEPTION 'You are not a member of this group' USING ERRCODE = '42501';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Bill amount must be positive';
  END IF;

  IF p_title IS NULL OR length(trim(p_title)) = 0 THEN
    RAISE EXCEPTION 'Bill title is required';
  END IF;

  IF p_category IS NULL OR length(trim(p_category)) = 0 THEN
    RAISE EXCEPTION 'Bill category is required';
  END IF;

  IF p_split_among IS NULL OR array_length(p_split_among, 1) IS NULL THEN
    RAISE EXCEPTION 'At least one split member is required';
  END IF;

  IF p_payers IS NULL OR jsonb_typeof(p_payers) <> 'object' THEN
    RAISE EXCEPTION 'Payers must be a JSON object';
  END IF;

  SELECT COALESCE(SUM(value::numeric), 0)
  INTO payer_sum
  FROM jsonb_each_text(p_payers);

  IF abs(payer_sum - p_amount) > 0.5 THEN
    RAISE EXCEPTION 'Payer total (%) must match bill amount (%)', payer_sum, p_amount;
  END IF;

  IF p_is_update THEN
    UPDATE public.bills
    SET
      group_id = p_group_id,
      title = trim(p_title),
      category = trim(p_category),
      amount = p_amount,
      date = p_date
    WHERE id = p_bill_id
      AND private.check_group_membership(group_id);

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Bill not found or not accessible' USING ERRCODE = '42501';
    END IF;

    DELETE FROM public.bill_payers WHERE bill_id = p_bill_id;
    DELETE FROM public.bill_splits WHERE bill_id = p_bill_id;
  ELSE
    INSERT INTO public.bills (id, group_id, title, category, amount, date)
    VALUES (p_bill_id, p_group_id, trim(p_title), trim(p_category), p_amount, p_date);
  END IF;

  FOR payer IN SELECT key AS user_id, value::numeric AS amount_paid FROM jsonb_each_text(p_payers)
  LOOP
    IF payer.amount_paid > 0 THEN
      INSERT INTO public.bill_payers (bill_id, user_id, amount_paid)
      VALUES (p_bill_id, payer.user_id, payer.amount_paid);
    END IF;
  END LOOP;

  FOREACH split_user IN ARRAY p_split_among
  LOOP
    INSERT INTO public.bill_splits (bill_id, user_id)
    VALUES (p_bill_id, split_user)
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.save_bill(
  text,
  text,
  text,
  text,
  numeric,
  text,
  jsonb,
  text[],
  boolean
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.save_bill(
  text,
  text,
  text,
  text,
  numeric,
  text,
  jsonb,
  text[],
  boolean
) TO authenticated;
