// AI Provider - Using Kimi/OpenAI compatible API
const AI_API_URL = process.env.AI_API_URL || 'https://api.moonshot.cn/v1';
const AI_API_KEY = process.env.AI_API_KEY || process.env.KIMI_API_KEY;

interface GenerateOptions {
  system?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export class AIError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AIError';
  }
}

export const Kimi = {
  async generate(options: GenerateOptions): Promise<string> {
    const { system, prompt, temperature = 0.7, maxTokens = 2000, model = 'kimi-coding/k2p5' } = options;

    try {
      const response = await fetch(`${AI_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            ...(system ? [{ role: 'system', content: system }] : []),
            { role: 'user', content: prompt },
          ],
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new AIError(`AI API error: ${error}`, response.status.toString());
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('AI generation error:', error);
      throw error;
    }
  },

  async generateJSON<T>(options: GenerateOptions): Promise<T> {
    const text = await this.generate({
      ...options,
      system: `${options.system || ''}\n\nYou must respond with valid JSON only. No markdown, no explanations.`,
    });

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new AIError('No JSON found in response');
    }

    try {
      return JSON.parse(jsonMatch[0]) as T;
    } catch (e) {
      throw new AIError(`Invalid JSON: ${e}`);
    }
  },
};

// Direct fetch for custom implementations
export async function fetchAI(options: GenerateOptions): Promise<Response> {
  const { system, prompt, temperature = 0.7, maxTokens = 2000, model = 'kimi-coding/k2p5' } = options;

  return fetch(`${AI_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });
}
