-- Motion SaaS Database Schema

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  credits INTEGER DEFAULT 5,
  session_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_paid BOOLEAN DEFAULT FALSE
);

-- Videos table
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT,
  prompt TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, analyzing, directing, voicing, rendering, completed, failed
  art_direction JSONB,
  voiceover_url TEXT,
  video_url TEXT,
  scenes JSONB,
  timeline JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Credit transactions
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT CHECK (type IN ('free', 'purchase', 'usage')), 
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for voiceovers
INSERT INTO storage.buckets (id, name, public) 
VALUES ('voiceovers', 'voiceovers', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (session_ip LIKE '%' || auth.uid()::text);

-- Videos are viewable by session
CREATE POLICY "Videos viewable by session" ON videos
  FOR SELECT USING (true); -- Simplified - check session in app layer

-- Credit transactions viewable by user
CREATE POLICY "Credit transactions viewable by user" ON credit_transactions
  FOR SELECT USING (user_id IN (
    SELECT id FROM users WHERE session_ip LIKE '%' || auth.uid()::text
  ));

-- Create indexes
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_session_id ON videos(session_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_users_session_ip ON users(session_ip);
