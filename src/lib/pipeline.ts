// Complete Video Generation Pipeline
// This orchestrates all sub-agents and renders the final video

import { supabaseAdmin } from './supabase';
import { 
  runAnalyzerAgent, 
  runArtDirectorAgent, 
  runVoiceScriptAgent, 
  runSceneGeneratorAgent 
} from './agents';
import { generateFullVoiceover } from './voice';
import { renderVideo } from './render';
import { uploadAudio } from './storage';

export interface VideoPipelineOptions {
  videoId: string;
  prompt: string;
}

/**
 * Run the complete video generation pipeline
 */
export async function runVideoPipeline(options: VideoPipelineOptions) {
  const { videoId, prompt } = options;

  try {
    // Phase 1: Analyze
    console.log(`[${videoId}] Phase 1: Analyzing prompt...`);
    await updateVideoStatus(videoId, 'analyzing');
    
    const analysis = await runAnalyzerAgent(prompt);
    await updateVideoData(videoId, { 
      analysis,
      estimated_duration: analysis.duration,
    });

    // Phase 2: Art Direction
    console.log(`[${videoId}] Phase 2: Creating art direction...`);
    await updateVideoStatus(videoId, 'directing');
    
    const artDirection = await runArtDirectorAgent(prompt, analysis);
    await updateVideoData(videoId, {
      art_direction: artDirection,
      color_palette: artDirection.color_palette,
      visual_style: artDirection.visual_style,
    });

    // Phase 3: Voice Script
    console.log(`[${videoId}] Phase 3: Writing voice script...`);
    await updateVideoStatus(videoId, 'writing_script');
    
    const voiceScript = await runVoiceScriptAgent(artDirection);
    await updateVideoData(videoId, {
      script: voiceScript,
    });

    // Phase 4: Generate Voiceover
    console.log(`[${videoId}] Phase 4: Generating voiceover...`);
    await updateVideoStatus(videoId, 'generating_voice');
    
    const voiceSections = await generateVoiceoverWithUpload(
      videoId,
      voiceScript.sections
    );
    
    await updateVideoData(videoId, {
      voice_sections: voiceSections,
      total_duration: voiceScript.total_duration,
    });

    // Phase 5: Generate Scenes
    console.log(`[${videoId}] Phase 5: Generating scenes...`);
    await updateVideoStatus(videoId, 'generating_scenes');
    
    const scenes = await runSceneGeneratorAgent(artDirection, voiceScript.sections);
    await updateVideoData(videoId, {
      scenes: scenes.scenes,
      composition_config: scenes.composition_config,
    });

    // Phase 6: Render Video
    console.log(`[${videoId}] Phase 6: Rendering video...`);
    await updateVideoStatus(videoId, 'rendering');
    
    const videoUrl = await renderVideo({
      videoId,
      scenes: scenes.scenes,
      audioUrls: voiceSections.map(v => v.audioUrl),
      compositionConfig: scenes.composition_config,
    });

    // Phase 7: Complete
    console.log(`[${videoId}] Complete! Video URL: ${videoUrl}`);
    await updateVideoStatus(videoId, 'completed');
    await updateVideoData(videoId, {
      video_url: videoUrl,
      completed_at: new Date().toISOString(),
    });

    return { success: true, videoUrl };

  } catch (error: any) {
    console.error(`[${videoId}] Pipeline failed:`, error);
    await updateVideoStatus(videoId, 'failed');
    await updateVideoData(videoId, {
      error_message: error.message,
    });
    throw error;
  }
}

/**
 * Generate voiceover and upload to storage
 */
async function generateVoiceoverWithUpload(
  videoId: string,
  sections: any[]
): Promise<any[]> {
  const voiceSections = [];
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    
    // Generate voice using ElevenLabs
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + getVoiceId(section.emotion), {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text: section.text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Voice generation failed for section ${i}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = await uploadAudio(audioBlob, videoId, section.name);
    
    voiceSections.push({
      sectionName: section.name,
      audioUrl,
      duration: section.estimated_duration,
    });
  }
  
  return voiceSections;
}

function getVoiceId(emotion: string): string {
  const map: Record<string, string> = {
    excited: 'TX3LPaxmHKxFdv7VOQHJ',
    calm: 'XB7hH8MSUJpSbSDYk0k2',
    serious: 'pNInz6obpgDQGcFmaJgB',
    hopeful: 'hpp4J3VqNfWAUOO0d1Us',
    determined: 'IKne3meq5aSn9XLyUdCD',
    cheerful: 'FGY2WhTYpPnrIDTdsKH5',
  };
  return map[emotion] || map.serious;
}

async function updateVideoStatus(videoId: string, status: string) {
  await supabaseAdmin
    .from('videos')
    .update({ status })
    .eq('id', videoId);
}

async function updateVideoData(videoId: string, data: any) {
  await supabaseAdmin
    .from('videos')
    .update(data)
    .eq('id', videoId);
}
