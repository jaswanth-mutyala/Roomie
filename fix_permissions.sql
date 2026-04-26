-- Roomie App: least-privilege grants for Supabase Data API.
-- RLS policies in supabase_rls_policies.sql still decide which rows a user can access.

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE group_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE bills TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE bill_payers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE bill_splits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE settlements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE recurring_bills TO authenticated;

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
