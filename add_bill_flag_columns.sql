-- Run this once in Supabase SQL Editor for existing Roomie databases.
-- New databases created from supabase_schema.sql already include these columns.

ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS flag_by text,
  ADD COLUMN IF NOT EXISTS flag_reason text;

DO $$
BEGIN
  ALTER TABLE bills
    ADD CONSTRAINT bills_flag_by_fkey
    FOREIGN KEY (flag_by) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
