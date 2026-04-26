-- Recommended production indexes for Roomie.
-- Run in Supabase SQL Editor after creating the base schema.

CREATE INDEX IF NOT EXISTS group_members_user_id_idx
  ON group_members (user_id);

CREATE INDEX IF NOT EXISTS bills_group_id_idx
  ON bills (group_id);

CREATE INDEX IF NOT EXISTS bill_payers_user_id_idx
  ON bill_payers (user_id);

CREATE INDEX IF NOT EXISTS bill_splits_user_id_idx
  ON bill_splits (user_id);

CREATE INDEX IF NOT EXISTS settlements_group_id_idx
  ON settlements (group_id);

CREATE INDEX IF NOT EXISTS settlements_from_user_idx
  ON settlements (from_user);

CREATE INDEX IF NOT EXISTS settlements_to_user_idx
  ON settlements (to_user);

CREATE INDEX IF NOT EXISTS recurring_bills_group_id_idx
  ON recurring_bills (group_id);

CREATE INDEX IF NOT EXISTS recurring_bills_payer_id_idx
  ON recurring_bills (payer_id);
