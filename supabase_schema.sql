-- Run this in your Supabase SQL Editor

-- 1. Create Users Table
CREATE TABLE users (
  id text PRIMARY KEY,
  name text NOT NULL,
  color text NOT NULL,
  upi text,
  karma integer DEFAULT 0,
  streak integer DEFAULT 0,
  is_me boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Create Groups Table
CREATE TABLE groups (
  id text PRIMARY KEY,
  name text NOT NULL,
  emoji text NOT NULL,
  bg text NOT NULL,
  accent text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Create Group Members Table (Many-to-Many)
CREATE TABLE group_members (
  group_id text REFERENCES groups(id) ON DELETE CASCADE,
  user_id text REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, user_id)
);

-- 4. Create Bills Table
CREATE TABLE bills (
  id text PRIMARY KEY,
  group_id text REFERENCES groups(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL,
  date text NOT NULL,
  flag_by text REFERENCES users(id) ON DELETE SET NULL,
  flag_reason text,
  created_at timestamp with time zone DEFAULT now()
);

-- 5. Create Bill Payers Table (Who paid how much)
CREATE TABLE bill_payers (
  bill_id text REFERENCES bills(id) ON DELETE CASCADE,
  user_id text REFERENCES users(id) ON DELETE CASCADE,
  amount_paid numeric NOT NULL,
  PRIMARY KEY (bill_id, user_id)
);

-- 6. Create Bill Splits Table (Who is involved in the split)
CREATE TABLE bill_splits (
  bill_id text REFERENCES bills(id) ON DELETE CASCADE,
  user_id text REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (bill_id, user_id)
);

-- 7. Create Settlements Table
CREATE TABLE settlements (
  id text PRIMARY KEY,
  group_id text REFERENCES groups(id) ON DELETE CASCADE,
  from_user text REFERENCES users(id) ON DELETE CASCADE,
  to_user text REFERENCES users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  date text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  created_at timestamp with time zone DEFAULT now()
);

-- 8. Create Recurring Bills Table
CREATE TABLE recurring_bills (
  id text PRIMARY KEY,
  group_id text REFERENCES groups(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL,
  frequency text NOT NULL,
  day integer NOT NULL,
  paused boolean DEFAULT false,
  payer_id text REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

-- 9. Enable Row Level Security (RLS).
-- Apply supabase_rls_policies.sql after this schema to create least-privilege policies.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_bills ENABLE ROW LEVEL SECURITY;

-- 10. Enable Realtime on tables
alter publication supabase_realtime add table users;
alter publication supabase_realtime add table groups;
alter publication supabase_realtime add table group_members;
alter publication supabase_realtime add table bills;
alter publication supabase_realtime add table bill_payers;
alter publication supabase_realtime add table bill_splits;
alter publication supabase_realtime add table settlements;
alter publication supabase_realtime add table recurring_bills;

-- 10. Enable Realtime on tables safely
-- DO $$
-- DECLARE
--     tbl text;
--     tables_to_add text[] := ARRAY['users', 'groups', 'group_members', 'bills', 'bill_payers', 'bill_splits', 'settlements', 'recurring_bills'];
-- BEGIN
--     FOREACH tbl IN ARRAY tables_to_add
--     LOOP
--         -- Check if the table is NOT already in the publication
--         IF NOT EXISTS (
--             SELECT 1 
--             FROM pg_publication_tables 
--             WHERE pubname = 'supabase_realtime' 
--             AND tablename = tbl
--         ) THEN
--             EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
--         END IF;
--     END LOOP;
-- END $$;