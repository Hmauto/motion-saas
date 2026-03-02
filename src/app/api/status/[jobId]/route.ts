import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    const { data: video, error } = await supabaseAdmin
      .from('videos')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Get user credits
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('credits')
      .eq('id', video.user_id)
      .single();

    return NextResponse.json({
      videoId: video.id,
      status: video.status,
      prompt: video.prompt,
      videoUrl: video.video_url,
      createdAt: video.created_at,
      completedAt: video.completed_at,
      creditsRemaining: user?.credits || 0,
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
