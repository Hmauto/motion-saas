'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Video, Coins } from 'lucide-react';

interface VideoFormProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
  credits: number;
}

export function VideoForm({ onSubmit, isLoading, credits }: VideoFormProps) {
  const [prompt, setPrompt] = useState('');
  const [charCount, setCharCount] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim().length >= 10 && credits > 0) {
      onSubmit(prompt.trim());
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
            Describe what you want, our AI will create motion graphics
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
          Each video takes 2-3 minutes to generate • 1080x1920 vertical format
        </p>
      </form>
    </div>
  );
}
