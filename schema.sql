-- Motion SaaS Database Schema
-- Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    ip_address TEXT,
    session_id TEXT,
    credits INTEGER DEFAULT 5,
    is_anonymous BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Videos table
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, analyzing, directing, generating_voice, rendering, completed, failed
    
    -- Art Direction
    concept_title TEXT,
    concept_description TEXT,
    visual_style TEXT,
    color_palette JSONB,
    mood_tags TEXT[],
    
    -- Timeline/Sections
    sections JSONB, -- Array of {id, duration, voiceover_url, script, emotion_tags}
    total_duration INTEGER, -- in seconds
    
    -- Output
    video_url TEXT,
    thumbnail_url TEXT,
    
    -- Metadata
    credits_used INTEGER DEFAULT 1,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Credit transactions table
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- positive for add, negative for use
    type TEXT NOT NULL, -- free_signup, ip_bonus, login_bonus, purchase, video_generation, refund
    description TEXT,
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sub-agent jobs tracking
CREATE TABLE agent_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    agent_type TEXT NOT NULL, -- analyzer, art_director, voice_generator, scene_generator, renderer
    status TEXT DEFAULT 'pending', -- pending, running, completed, failed
    input_payload JSONB,
    output_payload JSONB,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_session ON users(session_id);
CREATE INDEX idx_users_ip ON users(ip_address);
CREATE INDEX idx_videos_user ON videos(user_id);
CREATE INDEX idx_videos_session ON videos(session_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX idx_agent_jobs_video ON agent_jobs(video_id);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id OR session_id = current_setting('app.current_session_id', true));

CREATE POLICY "Users can view own videos" ON videos
    FOR SELECT USING (user_id IN (SELECT id FROM users WHERE session_id = current_setting('app.current_session_id', true)));

CREATE POLICY "Users can insert videos" ON videos
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE session_id = current_setting('app.current_session_id', true)));

CREATE POLICY "Users can view own transactions" ON credit_transactions
    FOR SELECT USING (user_id IN (SELECT id FROM users WHERE session_id = current_setting('app.current_session_id', true)));

-- Function to update user credits
CREATE OR REPLACE FUNCTION update_user_credits()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET credits = credits + NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update credits
CREATE TRIGGER trigger_update_credits
    AFTER INSERT ON credit_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_credits();

-- Function to check credits before video creation
CREATE OR REPLACE FUNCTION check_credits_before_video()
RETURNS TRIGGER AS $$
DECLARE
    user_credits INTEGER;
BEGIN
    SELECT credits INTO user_credits FROM users WHERE id = NEW.user_id;
    
    IF user_credits < NEW.credits_used THEN
        RAISE EXCEPTION 'Insufficient credits';
    END IF;
    
    -- Deduct credits
    INSERT INTO credit_transactions (user_id, amount, type, description, video_id)
    VALUES (NEW.user_id, -NEW.credits_used, 'video_generation', 'Video generation', NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for credit check
CREATE TRIGGER trigger_check_credits
    BEFORE INSERT ON videos
    FOR EACH ROW
    EXECUTE FUNCTION check_credits_before_video();
