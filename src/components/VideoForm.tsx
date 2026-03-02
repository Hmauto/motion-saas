'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Video, Coins, Mic } from 'lucide-react';

interface Voice {
  id: string;
  name: string;
  category?: string;
}

interface VideoFormProps {
  onSubmit: (prompt: string, voiceId: string) => void;
  isLoading: boolean;
  credits: number;
}

export function VideoForm({ onSubmit, isLoading, credits }: VideoFormProps) {
  const [prompt, setPrompt] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [voiceId, setVoiceId] = useState('Adam');
  const [voices, setVoices] = useState<Voice[]>([]);

  useEffect(() => {
    // Fetch available voices
    fetch('/api/voices')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setVoices(data);
        }
      })
      .catch(() => {
        // Fallback voices
        setVoices([
          { id: 'Adam', name: 'Adam', category: 'premade' },
          { id: 'Bella', name: 'Bella', category: 'premade' },
          { id: 'Antoni', name: 'Antoni', category: 'premade' },
          { id: 'Josh', name: 'Josh', category: 'premade' },
          { id: 'Rachel', name: 'Rachel', category: 'premade' },
        ]);
      });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim().length >= 10 && credits > 0) {
      onSubmit(prompt.trim(), voiceId);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-white">
            Create Your Video
          </h2>
          <p className="text-gray-400">
            Describe what you want, our AI will create motion graphics with voiceover
          </p>
        </div>

        {/* Credit Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-full border border-gray-700">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-gray-300">
              {credits} credits remaining
            </span>
          </div>
        </div>

        {/* Prompt Input */}
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              setCharCount(e.target.value.length);
            }}
            placeholder="Describe your video idea... (e.g., 'A motivational video about overcoming procrastination with energetic visuals')"
            className="w-full h-40 px-6 py-4 bg-gray-900/50 border border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 resize-none transition-all"
            disabled={isLoading || credits < 1}
          />
          <div className="absolute bottom-4 right-4 text-xs text-gray-500">
            {charCount} chars
          </div>
        </div>

        {/* Voice Selection */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <Mic className="w-4 h-4" />
            Voice
          </label>
          <div className="flex flex-wrap gap-2">
            {voices.map((voice) => (
              <button
                key={voice.id}
                type="button"
                onClick={() => setVoiceId(voice.id)}
                disabled={isLoading}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  voiceId === voice.id
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                } disabled:opacity-50`}
              >
                {voice.name}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || prompt.length < 10 || credits < 1}
          className="w-full py-4 bg-gradient-to-r from-pink-500 to-violet-500 text-white font-semibold rounded-2xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating your video...
            </>
          ) : credits < 1 ? (
            <>
              <Coins className="w-5 h-5" />
              No credits remaining
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Video (1 credit)
            </>
          )}
        </button>

        {/* Info */}
        <p className="text-center text-xs text-gray-500">
          Each video takes 2-3 minutes • AI voiceover included • 1080x1920 vertical format
        </p>
      </form>
    </div>
  );
}
