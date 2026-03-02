import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const sessionId = request.cookies.get('session_id')?.value;
    const { videoId } = params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session' },
        { status: 401 }
      );
    }

    // Get video with user verification
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

    return NextResponse.json({
      video: {
        id: video.id,
        status: video.status,
        prompt: video.prompt,
        conceptTitle: video.art_direction?.concept?.slice(0, 50) + '...' || null,
        visualStyle: video.visual_style,
        videoUrl: video.video_url,
        thumbnailUrl: video.thumbnail_url,
        totalDuration: video.total_duration,
        errorMessage: video.error_message,
        createdAt: video.created_at,
        completedAt: video.completed_at,
      },
    });

  } catch (error: any) {
    console.error('Status error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
