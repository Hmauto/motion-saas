import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSessionId } from '@/lib/session';

export async function GET(
  req: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const sessionId = getSessionId();
    const { videoId } = params;

    // Get video with user check
    const { data: video, error } = await supabaseAdmin
      .from('videos')
      .select(`
        *,
        users!inner(session_id)
      `)
      .eq('id', videoId)
      .eq('users.session_id', sessionId)
      .single();

    if (error || !video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Get agent jobs for this video
    const { data: jobs } = await supabaseAdmin
      .from('agent_jobs')
      .select('*')
      .eq('video_id', videoId)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      video: {
        id: video.id,
        status: video.status,
        prompt: video.prompt,
        conceptTitle: video.concept_title,
        conceptDescription: video.concept_description,
        visualStyle: video.visual_style,
        colorPalette: video.color_palette,
        moodTags: video.mood_tags,
        sections: video.sections,
        totalDuration: video.total_duration,
        videoUrl: video.video_url,
        thumbnailUrl: video.thumbnail_url,
        creditsUsed: video.credits_used,
        errorMessage: video.error_message,
        createdAt: video.created_at,
        completedAt: video.completed_at,
      },
      jobs: jobs || [],
    });

  } catch (error: any) {
    console.error('Status API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
