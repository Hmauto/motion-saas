import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for browser (public)
export const supabaseClient = createClient(supabaseUrl, supabaseKey);

// Admin client for server operations
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

// Types
export interface User {
  id: string;
  email?: string;
  credits: number;
  session_ip?: string;
  created_at: string;
  is_paid: boolean;
}

export interface Video {
  id: string;
  user_id: string;
  session_id: string;
  prompt: string;
  status: 'pending' | 'analyzing' | 'directing' | 'voicing' | 'rendering' | 'completed' | 'failed';
  art_direction?: ArtDirection;
  voiceover_url?: string;
  video_url?: string;
  scenes?: Scene[];
  timeline?: TimelineSection[];
  created_at: string;
  completed_at?: string;
}

export interface ArtDirection {
  concept: string;
  color_palette: { name: string; hex: string }[];
  typography: string;
  motion_principles: string[];
  sections: SectionDirection[];
}

export interface SectionDirection {
  name: string;
  duration: number;
  visual_description: string;
  animation_style: string;
}

export interface Scene {
  id: string;
  section_name: string;
  component_code: string;
  duration: number;
}

export interface TimelineSection {
  name: string;
  start_frame: number;
  end_frame: number;
  voiceover_text: string;
  emotion_tag: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'free' | 'purchase' | 'usage';
  description: string;
  created_at: string;
}
