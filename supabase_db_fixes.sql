-- DATABASE FIXES FOR ROOMIE

-- 1. Add missing notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  name text,
  color text,
  title text NOT NULL,
  sub text,
  time timestamp with time zone DEFAULT now(),
  unread boolean DEFAULT true,
  action_type text,
  action_id text,
  action_group_id text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid())::text);

-- 2. Add critical indexes
CREATE INDEX IF NOT EXISTS idx_bills_group_id ON public.bills(group_id);
CREATE INDEX IF NOT EXISTS idx_bills_date ON public.bills(date);
CREATE INDEX IF NOT EXISTS idx_bill_payers_bill_id ON public.bill_payers(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_payers_user_id ON public.bill_payers(user_id);
CREATE INDEX IF NOT EXISTS idx_bill_splits_bill_id ON public.bill_splits(bill_id);
CREATE INDEX IF NOT EXISTS idx_settlements_group_id ON public.settlements(group_id);
CREATE INDEX IF NOT EXISTS idx_settlements_from_user ON public.settlements(from_user);
CREATE INDEX IF NOT EXISTS idx_settlements_to_user ON public.settlements(to_user);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_bills_group_id ON public.recurring_bills(group_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 3. Add updated_at columns for audit trail
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;
ALTER TABLE public.settlements ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;
ALTER TABLE public.recurring_bills ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;

-- 4. Add created_by tracking
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS created_by text REFERENCES users(id) ON DELETE SET NULL;

-- 5. Add CHECK constraint for positive amounts
ALTER TABLE public.bills ADD CONSTRAINT chk_bills_amount_positive CHECK (amount > 0);
ALTER TABLE public.recurring_bills ADD CONSTRAINT chk_recurring_amount_positive CHECK (amount > 0);
ALTER TABLE public.settlements ADD CONSTRAINT chk_settlements_amount_positive CHECK (amount > 0);

-- 6. Fix users INSERT policy (was too permissive)
DROP POLICY IF EXISTS "Users can create profiles" ON users;
CREATE POLICY "Users can create own profile" ON users
  FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid())::text);

-- 7. Auto-add creator to group_members on group creation
CREATE OR REPLACE FUNCTION public.auto_add_group_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id)
  VALUES (NEW.id, (SELECT auth.uid())::text)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_add_creator ON public.groups;
CREATE TRIGGER trg_auto_add_creator
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_group_creator();
