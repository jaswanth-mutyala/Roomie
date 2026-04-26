-- Roomie App: production-oriented RLS policies.
-- Run after supabase_schema.sql. This script is idempotent.

-- Ensure bills table has flagging columns
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS flag_by text;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS flag_reason text;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
REVOKE ALL ON SCHEMA private FROM authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.check_group_membership(target_group_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = target_group_id
      AND gm.user_id = (SELECT auth.uid())::text
  );
$$;

CREATE OR REPLACE FUNCTION private.can_access_bill(target_bill_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bills b
    WHERE b.id = target_bill_id
      AND private.check_group_membership(b.group_id)
  );
$$;

CREATE OR REPLACE FUNCTION private.can_view_user(target_user_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT target_user_id = (SELECT auth.uid())::text
    OR EXISTS (
      SELECT 1
      FROM public.group_members mine
      JOIN public.group_members theirs ON theirs.group_id = mine.group_id
      WHERE mine.user_id = (SELECT auth.uid())::text
        AND theirs.user_id = target_user_id
    );
$$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA private FROM anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO authenticated;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'users',
        'groups',
        'group_members',
        'bills',
        'bill_payers',
        'bill_splits',
        'recurring_bills',
        'settlements'
      )
  )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

CREATE POLICY "Users can view own and shared profiles" ON users
  FOR SELECT TO authenticated
  USING (private.can_view_user(id));

CREATE POLICY "Users can create profiles" ON users
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can edit own profile" ON users
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid())::text)
  WITH CHECK (id = (SELECT auth.uid())::text);

CREATE POLICY "Users can view their groups" ON groups
  FOR SELECT TO authenticated
  USING (private.check_group_membership(id));

CREATE POLICY "Users can create groups" ON groups
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Users can edit their groups" ON groups
  FOR UPDATE TO authenticated
  USING (private.check_group_membership(id))
  WITH CHECK (private.check_group_membership(id));

CREATE POLICY "Users can delete their groups" ON groups
  FOR DELETE TO authenticated
  USING (private.check_group_membership(id));

CREATE POLICY "Users can view members of their groups" ON group_members
  FOR SELECT TO authenticated
  USING (private.check_group_membership(group_id));

CREATE POLICY "Users can join or add members to their groups" ON group_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())::text
    OR private.check_group_membership(group_id)
  );

CREATE POLICY "Users can remove themselves or members from their groups" ON group_members
  FOR DELETE TO authenticated
  USING (
    user_id = (SELECT auth.uid())::text
    OR private.check_group_membership(group_id)
  );

CREATE POLICY "Users can view bills in their groups" ON bills
  FOR SELECT TO authenticated
  USING (private.check_group_membership(group_id));

CREATE POLICY "Users can create bills in their groups" ON bills
  FOR INSERT TO authenticated
  WITH CHECK (private.check_group_membership(group_id));

CREATE POLICY "Users can edit bills in their groups" ON bills
  FOR UPDATE TO authenticated
  USING (private.check_group_membership(group_id))
  WITH CHECK (private.check_group_membership(group_id));

CREATE POLICY "Users can delete bills in their groups" ON bills
  FOR DELETE TO authenticated
  USING (private.check_group_membership(group_id));

CREATE POLICY "Users can view bill payers in their groups" ON bill_payers
  FOR SELECT TO authenticated
  USING (private.can_access_bill(bill_id));

CREATE POLICY "Users can create bill payers in their groups" ON bill_payers
  FOR INSERT TO authenticated
  WITH CHECK (private.can_access_bill(bill_id));

CREATE POLICY "Users can edit bill payers in their groups" ON bill_payers
  FOR UPDATE TO authenticated
  USING (private.can_access_bill(bill_id))
  WITH CHECK (private.can_access_bill(bill_id));

CREATE POLICY "Users can delete bill payers in their groups" ON bill_payers
  FOR DELETE TO authenticated
  USING (private.can_access_bill(bill_id));

CREATE POLICY "Users can view bill splits in their groups" ON bill_splits
  FOR SELECT TO authenticated
  USING (private.can_access_bill(bill_id));

CREATE POLICY "Users can create bill splits in their groups" ON bill_splits
  FOR INSERT TO authenticated
  WITH CHECK (private.can_access_bill(bill_id));

CREATE POLICY "Users can edit bill splits in their groups" ON bill_splits
  FOR UPDATE TO authenticated
  USING (private.can_access_bill(bill_id))
  WITH CHECK (private.can_access_bill(bill_id));

CREATE POLICY "Users can delete bill splits in their groups" ON bill_splits
  FOR DELETE TO authenticated
  USING (private.can_access_bill(bill_id));

CREATE POLICY "Users can access recurring bills in their groups" ON recurring_bills
  FOR ALL TO authenticated
  USING (private.check_group_membership(group_id))
  WITH CHECK (private.check_group_membership(group_id));

CREATE POLICY "Users can access settlements in their groups" ON settlements
  FOR ALL TO authenticated
  USING (private.check_group_membership(group_id))
  WITH CHECK (private.check_group_membership(group_id));
