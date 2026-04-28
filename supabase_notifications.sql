CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  name text NOT NULL,
  color text NOT NULL,
  title text NOT NULL,
  sub text NOT NULL,
  time text NOT NULL,
  unread boolean DEFAULT true,
  action_type text,
  action_id text,
  action_group_id text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can view their notifications" 
ON notifications FOR SELECT 
USING (user_id = auth.uid()::text);

-- Triggers for database-level notifications would go here or we manage inserts in FE
CREATE POLICY "Users can insert notifications" 
ON notifications FOR INSERT 
WITH CHECK (true); -- Relaxed for testing/sending to others

CREATE POLICY "Users can update their notifications" 
ON notifications FOR UPDATE 
USING (user_id = auth.uid()::text);

alter publication supabase_realtime add table notifications;
