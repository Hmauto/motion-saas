// OpenClaw / OpenAI-compatible API client for spawning sub-agents
// Using the agent's direct API access

const OPENCLAW_GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:8080';
const OPENCLAW_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN;

export interface SpawnAgentOptions {
  task: string;
  agentId?: string;
  label?: string;
  timeoutSeconds?: number;
  model?: string;
}

export interface AgentJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

// Spawn a sub-agent using OpenClaw sessions_spawn equivalent
// Since we don't have direct API, we'll use a webhook-based approach
// where the main agent (us) processes the task and returns via callback

export async function spawnAgent(options: SpawnAgentOptions): Promise<AgentJob> {
  const { task, agentId = 'default', label, timeoutSeconds = 300 } = options;
  
  // Generate a unique job ID
  const jobId = `${agentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // In production, this would call OpenClaw gateway
  // For now, we'll create a job record and process it
  console.log(`[SPAWN] Agent: ${agentId}, Job: ${jobId}`);
  
  return {
    id: jobId,
    status: 'pending',
  };
}

// Alternative: Use direct AI calls for each sub-agent role
// This simulates sub-agents using the main agent's AI capabilities

import { Kimi } from '@/lib/ai';

export async function runAnalyzerAgent(prompt: string): Promise<any> {
  const systemPrompt = `You are a Prompt Analyzer for motion graphics videos.
Analyze the user's prompt and return ONLY a JSON object with this structure:
{
  "core_message": "Main theme (1-2 sentences)",
  "emotion": "Primary emotion (excited, calm, serious, hopeful, determined)",
  "visual_style": "Visual style (minimalist, energetic, cinematic, abstract)",
  "duration": 30,
  "complexity": 5,
  "sections": [
    {"name": "hook", "duration": 5, "purpose": "Grab attention", "suggested_visual": "Abstract description"},
    {"name": "body", "duration": 20, "purpose": "Main message", "suggested_visual": "Abstract description"},
    {"name": "cta", "duration": 5, "purpose": "Call to action", "suggested_visual": "Abstract description"}
  ],
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

Be creative. Visuals should be ABSTRACT metaphors, not text repetition.`;

  const response = await Kimi.generate({
    system: systemPrompt,
    prompt: `Analyze this video prompt: "${prompt}"`,
    temperature: 0.7,
  });

  try {
    return JSON.parse(response);
  } catch (e) {
    console.error('Failed to parse analyzer response:', response);
    throw new Error('Invalid analyzer output');
  }
}

export async function runArtDirectorAgent(
  prompt: string, 
  analysis: any
): Promise<any> {
  const systemPrompt = `You are an Art Director for motion graphics videos.
Create detailed art direction. Return ONLY JSON:
{
  "concept": "Visual concept (2-3 sentences)",
  "color_palette": [
    {"name": "Primary", "hex": "#e94560", "usage": "Main accent"},
    {"name": "Secondary", "hex": "#16213e", "usage": "Background"},
    {"name": "Highlight", "hex": "#ffd93d", "usage": "Energy moments"}
  ],
  "motion_principles": ["easing functions", "stagger animations", "scale emphasis"],
  "sections": [
    {
      "name": "hook",
      "duration": 5,
      "visual_description": "Detailed abstract visual - particles, shapes, etc.",
      "animation_style": "How elements animate",
      "emotion_visual": "How to show emotion visually"
    }
  ]
}

FOCUS ON ABSTRACT VISUALS - particles, shapes, waves - NOT text on screen.`;

  const response = await Kimi.generate({
    system: systemPrompt,
    prompt: `Create art direction for: "${prompt}"\n\nAnalysis: ${JSON.stringify(analysis, null, 2)}`,
    temperature: 0.8,
  });

  try {
    return JSON.parse(response);
  } catch (e) {
    console.error('Failed to parse art director response:', response);
    throw new Error('Invalid art director output');
  }
}

export async function runVoiceScriptAgent(
  artDirection: any
): Promise<any> {
  const systemPrompt = `You are a Voice Script Writer for video voiceovers.
Create a voiceover script with ElevenLabs v3 emotion tags.
Return ONLY JSON:
{
  "total_duration": 30,
  "sections": [
    {
      "name": "hook",
      "text": "Voiceover text with <break time=\"500ms\"/> and <emphasis>tags</emphasis>",
      "emotion": "excited|calm|serious|hopeful|determined",
      "pause_after": 0.5,
      "estimated_duration": 5
    }
  ],
  "full_script": "Complete script"
}

Use emotion tags: <break time=\"Xs\"/> <emphasis level=\"strong\">word</emphasis>
Keep text conversational. 1-2 sentences per section.`;

  const response = await Kimi.generate({
    system: systemPrompt,
    prompt: `Create voice script for art direction: ${JSON.stringify(artDirection, null, 2)}`,
    temperature: 0.7,
  });

  try {
    return JSON.parse(response);
  } catch (e) {
    console.error('Failed to parse voice script response:', response);
    throw new Error('Invalid voice script output');
  }
}

export async function runSceneGeneratorAgent(
  artDirection: any,
  voiceScript: any
): Promise<any> {
  const systemPrompt = `You are a Remotion Scene Generator.
Generate React components for motion graphics. Return ONLY JSON:
{
  "scenes": [
    {
      "section_name": "hook",
      "component_code": "export const HookScene: React.FC = () => { const frame = useCurrentFrame(); ... }",
      "duration": 150,
      "imports": ["useCurrentFrame", "interpolate", "AbsoluteFill", "Easing"]
    }
  ],
  "composition_config": {"width": 1080, "height": 1920, "fps": 30}
}

Rules:
1. Use Remotion hooks: useCurrentFrame, interpolate, AbsoluteFill, Easing
2. ABSTRACT visuals - particles, shapes, waves - NO text repeating voiceover
3. Use art direction colors
4. Match timing exactly
5. Return valid TypeScript React code as strings`;

  const response = await Kimi.generate({
    system: systemPrompt,
    prompt: `Generate Remotion scenes for:\nArt Direction: ${JSON.stringify(artDirection, null, 2)}\n\nVoice Script: ${JSON.stringify(voiceScript, null, 2)}`,
    temperature: 0.6,
    maxTokens: 4000,
  });

  try {
    return JSON.parse(response);
  } catch (e) {
    console.error('Failed to parse scene generator response:', response);
    throw new Error('Invalid scene generator output');
  }
}
