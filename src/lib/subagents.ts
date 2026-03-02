import { sessions_spawn } from 'openclaw';
import { Video, ArtDirection, TimelineSection } from './supabase';

const OPENCLAW_API_URL = process.env.OPENCLAW_API_URL || 'http://localhost:8080';
const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY;

export interface SubAgentResult {
  success: boolean;
  data?: any;
  error?: string;
}

// 1. Prompt Analyzer Sub-Agent
export async function spawnPromptAnalyzer(
  videoId: string,
  prompt: string
): Promise<SubAgentResult> {
  const task = `
You are a Prompt Analyzer for a motion graphics video SaaS.

Analyze this user prompt and extract key information for video generation:

USER PROMPT: "${prompt}"

Return a JSON object with:
{
  "core_message": "The main message/theme of the video (1-2 sentences)",
  "emotion": "Primary emotion to convey (excited, calm, serious, hopeful, determined, etc.)",
  "visual_style": "Suggested visual style (minimalist, energetic, cinematic, abstract, etc.)",
  "duration": Recommended duration in seconds (15-60),
  "complexity": Complexity score 1-10,
  "sections": [
    {
      "name": "hook",
      "duration": 5,
      "purpose": "Grab attention",
      "suggested_visual": "Abstract description"
    },
    {
      "name": "body",
      "duration": 20,
      "purpose": "Main message",
      "suggested_visual": "Abstract description"
    },
    {
      "name": "cta",
      "duration": 5,
      "purpose": "Call to action",
      "suggested_visual": "Abstract description"
    }
  ],
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

Be creative and think outside the box. The visuals should NOT just repeat the text - they should be abstract metaphors that complement the voiceover.
`;

  try {
    const result = await sessions_spawn({
      task,
      agentId: 'analyzer',
      label: `analyzer-${videoId}`,
      runTimeoutSeconds: 120,
    });
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// 2. Art Director Sub-Agent
export async function spawnArtDirector(
  videoId: string,
  prompt: string,
  analysis: any
): Promise<SubAgentResult> {
  const task = `
You are an Art Director for motion graphics videos.

USER PROMPT: "${prompt}"

ANALYSIS: ${JSON.stringify(analysis, null, 2)}

Create detailed art direction for this video. Return JSON:

{
  "concept": "Overall visual concept (2-3 sentences)",
  "color_palette": [
    {"name": "Primary", "hex": "#e94560", "usage": "Main accent"},
    {"name": "Secondary", "hex": "#16213e", "usage": "Background"},
    {"name": "Highlight", "hex": "#ffd93d", "usage": "Energy moments"}
  ],
  "typography": {
    "style": "Bold, modern, sans-serif",
    "max_words_per_screen": 3
  },
  "motion_principles": [
    "Use easing functions for natural motion",
    "Stagger animations for visual interest",
    "Scale and opacity for emphasis"
  ],
  "sections": [
    {
      "name": "hook",
      "duration": 5,
      "visual_description": "Detailed visual description - abstract shapes, particles, etc.",
      "animation_style": "How elements should animate",
      "color_focus": "Which colors dominate",
      "emotion_visual": "How to show the emotion visually"
    }
  ],
  "reference_mood": "Describe the overall mood like referencing a movie or art style"
}

IMPORTANT: Focus on ABSTRACT visuals - particles, shapes, waves, geometric forms - NOT text on screen.
`;

  try {
    const result = await sessions_spawn({
      task,
      agentId: 'art-director',
      label: `art-director-${videoId}`,
      runTimeoutSeconds: 120,
    });
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// 3. Voice Script Writer Sub-Agent
export async function spawnVoiceScriptWriter(
  videoId: string,
  artDirection: ArtDirection
): Promise<SubAgentResult> {
  const task = `
You are a Voice Script Writer for video voiceovers.

ART DIRECTION: ${JSON.stringify(artDirection, null, 2)}

Create a voiceover script divided into sections that match the art direction.
Each section should have text, emotion tag, and timing.

Return JSON:
{
  "total_duration": 30,
  "sections": [
    {
      "name": "hook",
      "text": "The voiceover text for this section",
      "emotion": "excited|calm|serious|hopeful|determined|cheerful",
      "pause_after": 0.5,
      "estimated_duration": 5
    }
  ],
  "full_script": "Complete script text"
}

Use ElevenLabs v3 emotion tags. Keep text conversational and impactful.
Each section should be 1-2 sentences max.
`;

  try {
    const result = await sessions_spawn({
      task,
      agentId: 'voice-writer',
      label: `voice-writer-${videoId}`,
      runTimeoutSeconds: 120,
    });
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// 4. Scene Generator Sub-Agent
export async function spawnSceneGenerator(
  videoId: string,
  artDirection: ArtDirection,
  timeline: TimelineSection[]
): Promise<SubAgentResult> {
  const task = `
You are a Remotion Scene Generator.

ART DIRECTION: ${JSON.stringify(artDirection, null, 2)}

TIMELINE: ${JSON.stringify(timeline, null, 2)}

Generate Remotion React components for each section. Return JSON:

{
  "scenes": [
    {
      "section_name": "hook",
      "component_code": "Complete React component code as string",
      "duration": 150,
      "imports": ["useCurrentFrame", "interpolate", "AbsoluteFill"]
    }
  ],
  "composition_config": {
    "width": 1080,
    "height": 1920,
    "fps": 30,
    "durationInFrames": 900
  }
}

Rules:
1. Use only Remotion hooks and standard React
2. Create ABSTRACT visuals - particles, shapes, animations
3. NO text repeating the voiceover
4. Use the color palette from art direction
5. Match timing to timeline sections
6. Export each scene as a separate component

Example component structure:
export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  // Animation logic
  return (
    <AbsoluteFill style={{ background: '...' }}>
      {/* Animated elements */}
    </AbsoluteFill>
  );
};
`;

  try {
    const result = await sessions_spawn({
      task,
      agentId: 'scene-generator',
      label: `scene-gen-${videoId}`,
      runTimeoutSeconds: 180,
    });
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
