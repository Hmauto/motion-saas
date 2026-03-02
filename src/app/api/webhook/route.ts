import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Webhook handler for sub-agent callbacks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, step, data, error } = body;

    if (!videoId || !step) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Handle different workflow steps
    switch (step) {
      case 'analysis_complete':
        await supabaseAdmin
          .from('videos')
          .update({
            status: 'directing',
            art_direction: data,
          })
          .eq('id', videoId);
        break;

      case 'art_direction_complete':
        await supabaseAdmin
          .from('videos')
          .update({
            status: 'generating_voice',
            art_direction: data,
          })
          .eq('id', videoId);
        break;

      case 'voice_complete':
        await supabaseAdmin
          .from('videos')
          .update({
            status: 'generating_scenes',
            voice_sections: data.sections,
            total_duration: data.totalDuration,
          })
          .eq('id', videoId);
        break;

      case 'scenes_complete':
        await supabaseAdmin
          .from('videos')
          .update({
            status: 'rendering',
            scenes: data.scenes,
          })
          .eq('id', videoId);
        break;

      case 'render_complete':
        await supabaseAdmin
          .from('videos')
          .update({
            status: 'completed',
            video_url: data.videoUrl,
            thumbnail_url: data.thumbnailUrl,
            completed_at: new Date().toISOString(),
          })
          .eq('id', videoId);
        break;

      case 'error':
        await supabaseAdmin
          .from('videos')
          .update({
            status: 'failed',
            error_message: error || 'Unknown error',
          })
          .eq('id', videoId);
        break;
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
