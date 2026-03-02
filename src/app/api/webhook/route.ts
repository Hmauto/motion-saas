import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateVoiceSection } from '@/lib/elevenlabs';
import { spawnArtDirector, spawnVoiceScriptWriter, spawnSceneGenerator } from '@/lib/subagents';

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

    // Get video record
    const { data: video } = await supabaseAdmin
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Handle different workflow steps
    switch (step) {
      case 'analysis_complete':
        // Trigger Art Director
        const artDirectionResult = await spawnArtDirector(
          videoId,
          video.prompt,
          data.analysis
        );
        
        if (artDirectionResult.success) {
          await supabaseAdmin
            .from('videos')
            .update({
              status: 'directing',
              art_direction: artDirectionResult.data,
            })
            .eq('id', videoId);
        }
        break;

      case 'art_direction_complete':
        // Trigger Voice Script Writer
        const voiceScriptResult = await spawnVoiceScriptWriter(
          videoId,
          data.artDirection
        );
        
        if (voiceScriptResult.success) {
          await supabaseAdmin
            .from('videos')
            .update({
              status: 'voicing',
              timeline: voiceScriptResult.data.sections,
            })
            .eq('id', videoId);

          // Generate voiceover sections
          const voiceBuffers: Buffer[] = [];
          for (const section of voiceScriptResult.data.sections) {
            const buffer = await generateVoiceSection(section.text, section.emotion);
            voiceBuffers.push(buffer);
          }

          // Combine and upload voiceover
          const combinedBuffer = Buffer.concat(voiceBuffers);
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('voiceovers')
            .upload(`${videoId}_voiceover.mp3`, combinedBuffer, {
              contentType: 'audio/mpeg',
            });

          if (!uploadError) {
            const { data: { publicUrl } } = supabaseAdmin.storage
              .from('voiceovers')
              .getPublicUrl(uploadData.path);

            await supabaseAdmin
              .from('videos')
              .update({ voiceover_url: publicUrl })
              .eq('id', videoId);

            // Trigger Scene Generator
            await spawnSceneGenerator(videoId, data.artDirection, voiceScriptResult.data.sections);
          }
        }
        break;

      case 'scenes_complete':
        // Update with scenes and start rendering
        await supabaseAdmin
          .from('videos')
          .update({
            status: 'rendering',
            scenes: data.scenes,
          })
          .eq('id', videoId);

        // Trigger video renderer (would be another sub-agent)
        // For now, mark as completed with placeholder
        await supabaseAdmin
          .from('videos')
          .update({
            status: 'completed',
            video_url: `https://placeholder.com/video/${videoId}.mp4`,
            completed_at: new Date().toISOString(),
          })
          .eq('id', videoId);
        break;

      case 'render_complete':
        await supabaseAdmin
          .from('videos')
          .update({
            status: 'completed',
            video_url: data.videoUrl,
            completed_at: new Date().toISOString(),
          })
          .eq('id', videoId);
        break;

      case 'error':
        await supabaseAdmin
          .from('videos')
          .update({
            status: 'failed',
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
