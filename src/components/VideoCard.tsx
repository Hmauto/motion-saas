'use client';

import { useEffect, useState } from 'react';
import { Video, Clock, Download, Loader2, CheckCircle, Mic, Play } from 'lucide-react';

interface VideoCardProps {
  videoId: string;
  status: string;
  prompt: string;
  videoUrl?: string;
  createdAt: string;
  onRefresh: () => void;
}

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Queued' },
  analyzing: { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Analyzing' },
  directing: { icon: Loader2, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Designing' },
  generating_voice: { icon: Mic, color: 'text-pink-500', bg: 'bg-pink-500/10', label: 'Voice' },
  rendering: { icon: Loader2, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Rendering' },
  completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Ready' },
  failed: { icon: Video, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Failed' },
};

export function VideoCard({ videoId, status, prompt, videoUrl, createdAt, onRefresh }: VideoCardProps) {
  const [isPolling, setIsPolling] = useState(status !== 'completed' && status !== 'failed');
  const [progress, setProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | undefined>();
  
  const config = statusConfig[status] || statusConfig.pending;
  const StatusIcon = config.icon;

  useEffect(() => {
    if (status === 'completed' || status === 'failed') {
      setIsPolling(false);
      return;
    }

    const interval = setInterval(() => {
      onRefresh();
    }, 5000);

    return () => clearInterval(interval);
  }, [status, onRefresh]);

  // Fetch full status to get progress and audio
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/status/${videoId}`);
        const data = await res.json();
        if (data.progress) setProgress(data.progress);
        if (data.audioUrl) setAudioUrl(data.audioUrl);
      } catch (e) {
        // ignore
      }
    };
    fetchStatus();
  }, [videoId, status]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProgressPercent = (status: string): number => {
    const progressMap: Record<string, number> = {
      pending: 10,
      analyzing: 25,
      directing: 40,
      generating_voice: 60,
      rendering: 80,
      completed: 100,
      failed: 0,
    };
    return progressMap[status] || 10;
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.bg}`}>
            <StatusIcon className={`w-5 h-5 ${config.color} ${status !== 'completed' && status !== 'failed' ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <span className={`text-sm font-medium ${config.color}`}>
              {config.label}
            </span>
            <p className="text-xs text-gray-500">
              {formatDate(createdAt)}
            </p>
          </div>
        </div>

        {status === 'completed' && videoUrl && (
          <a
            href={videoUrl}
            download
            className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white text-sm font-medium rounded-lg hover:bg-pink-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </a>
        )}
      </div>

      {/* Prompt */}
      <div className="bg-gray-950 rounded-xl p-4">
        <p className="text-sm text-gray-400 line-clamp-2">
          {prompt}
        </p>
      </div>

      {/* Audio Preview */}
      {audioUrl && (
        <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
          <Mic className="w-4 h-4 text-pink-500" />
          <audio controls className="w-full h-8">
            <source src={audioUrl} type="audio/mpeg" />
          </audio>
        </div>
      )}

      {/* Progress Bar for active jobs */}
      {isPolling && (
        <div className="space-y-2">
          <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-pink-500 to-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${getProgressPercent(status)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-center">
            {getProgressPercent(status)}% • Usually takes 2-3 minutes
          </p>
        </div>
      )}
    </div>
  );
}
