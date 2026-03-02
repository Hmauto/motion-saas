// ElevenLabs API Integration for Voice Generation
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Voice mapping for different emotions
const VOICE_MAP: Record<string, string> = {
  excited: 'TX3LPaxmHKxFdv7VOQHJ', // Liam - Energetic
  calm: 'XB7hH8MSUJpSbSDYk0k2', // Alice - Clear, engaging
  serious: 'pNInz6obpgDQGcFmaJgB', // Adam - Deep, powerful
  hopeful: 'hpp4J3VqNfWAUOO0d1Us', // Bella - Warm
  determined: 'IKne3meq5aSn9XLyUdCD', // Charlie - Confident
  cheerful: 'FGY2WhTYpPnrIDTdsKH5', // Laura - Enthusiast
  default: 'pNInz6obpgDQGcFmaJgB', // Adam
};

export interface VoiceSection {
  name: string;
  text: string;
  emotion: string;
  pause_after: number;
}

export interface GeneratedVoice {
  sectionName: string;
  audioUrl: string;
  duration: number;
}

/**
 * Generate voiceover for a section using ElevenLabs v3
 */
export async function generateVoiceSection(
  section: VoiceSection,
  index: number
): Promise<GeneratedVoice> {
  const voiceId = VOICE_MAP[section.emotion] || VOICE_MAP.default;
  
  // Process text with ElevenLabs v3 tags
  // Convert our custom tags to ElevenLabs format
  let processedText = section.text
    .replace(/<break time=\"([\d.]+)s\"\/>/g, '<break time="$1s" />')
    .replace(/<emphasis\u003e(.+?)<\/emphasis>/g, '<emphasis level="strong">$1</emphasis>');

  // Add pause at end
  if (section.pause_after > 0) {
    processedText += `<break time="${section.pause_after}s" />`;
  }

  try {
    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY!,
        },
        body: JSON.stringify({
          text: processedText,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs API error: ${error}`);
    }

    // Get audio blob
    const audioBlob = await response.blob();
    
    // Upload to Supabase Storage (we'll implement this)
    const audioUrl = await uploadAudioToStorage(audioBlob, `voice-${index}.mp3`);

    // Estimate duration (rough calculation: ~150 words per minute)
    const wordCount = section.text.split(/\s+/).length;
    const estimatedDuration = (wordCount / 150) * 60 + section.pause_after;

    return {
      sectionName: section.name,
      audioUrl,
      duration: estimatedDuration,
    };
  } catch (error) {
    console.error('Voice generation error:', error);
    throw error;
  }
}

/**
 * Generate all voice sections and combine them
 */
export async function generateFullVoiceover(
  sections: VoiceSection[]
): Promise<{ sections: GeneratedVoice[]; totalDuration: number }> {
  const generatedSections: GeneratedVoice[] = [];
  let totalDuration = 0;

  for (let i = 0; i < sections.length; i++) {
    const generated = await generateVoiceSection(sections[i], i);
    generatedSections.push(generated);
    totalDuration += generated.duration;
  }

  return { sections: generatedSections, totalDuration };
}

// Placeholder for Supabase storage upload
async function uploadAudioToStorage(blob: Blob, filename: string): Promise<string> {
  // This will be implemented with Supabase Storage
  // For now, return a placeholder URL
  return `https://storage.example.com/audio/${filename}`;
}

/**
 * Get available voices from ElevenLabs
 */
export async function getVoices(): Promise<any[]> {
  const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY!,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch voices');
  }

  const data = await response.json();
  return data.voices;
}
