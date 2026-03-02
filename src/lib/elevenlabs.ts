const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

export interface VoiceSection {
  text: string;
  emotion: string;
  pause_after: number; // seconds
}

export interface GeneratedVoice {
  url: string;
  duration: number;
  sections: VoiceSection[];
}

// ElevenLabs v3 emotion tags
const EMOTION_TAGS: Record<string, string> = {
  excited: '<emotion name="excited">',
  calm: '<emotion name="calm">',
  serious: '<emotion name="serious">',
  cheerful: '<emotion name="cheerful">',
  sad: '<emotion name="sad">',
  angry: '<emotion name="angry">',
  hopeful: '<emotion name="hopeful">',
  determined: '<emotion name="determined">',
};

export async function generateVoiceSection(
  text: string,
  emotion: string = 'calm',
  voiceId: string = 'pNInz6obpgDQGcFmaJgB' // Adam voice
): Promise<Buffer> {
  // Wrap text with emotion tags for v3 model
  const emotionTag = EMOTION_TAGS[emotion] || EMOTION_TAGS.calm;
  const wrappedText = `${emotionTag}${text}</emotion>`;

  const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: wrappedText,
      model_id: 'eleven_turbo_v2_5', // v3 model
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.3,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function generateFullVoiceover(
  sections: VoiceSection[]
): Promise<GeneratedVoice> {
  const audioBuffers: Buffer[] = [];
  let totalDuration = 0;

  for (const section of sections) {
    const audioBuffer = await generateVoiceSection(section.text, section.emotion);
    audioBuffers.push(audioBuffer);
    
    // Estimate duration (rough calculation)
    const wordsPerSecond = 2.5;
    const wordCount = section.text.split(' ').length;
    const sectionDuration = wordCount / wordsPerSecond + section.pause_after;
    totalDuration += sectionDuration;
  }

  // Combine audio buffers (simplified - in production use ffmpeg)
  const combinedBuffer = Buffer.concat(audioBuffers);
  
  // Upload to Supabase storage
  const { data, error } = await supabaseAdmin.storage
    .from('voiceovers')
    .upload(`${Date.now()}_voiceover.mp3`, combinedBuffer, {
      contentType: 'audio/mpeg',
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('voiceovers')
    .getPublicUrl(data.path);

  return {
    url: publicUrl,
    duration: totalDuration,
    sections,
  };
}

import { supabaseAdmin } from './supabase';
