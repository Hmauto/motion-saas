'use client';

import { useEffect, useState } from 'react';
import { VideoForm } from '@/components/VideoForm';
import { VideoCard } from '@/components/VideoCard';
import { Video, Coins } from 'lucide-react';

interface VideoJob {
  id: string;
  status: string;
  prompt: string;
  video_url?: string;
  created_at: string;
}

export default function CreatePage() {
  const [credits, setCredits] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState<VideoJob[]>([]);
  const [currentJob, setCurrentJob] = useState<VideoJob | null>(null);

  // Load credits on mount
  useEffect(() => {
    fetchCredits();
    loadVideos();
  }, []);

  const fetchCredits = async () => {
    try {
      const res = await fetch('/api/credits');
      const data = await res.json();
      setCredits(data.credits);
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    }
  };

  const loadVideos = () => {
    const saved = localStorage.getItem('motion_videos');
    if (saved) {
      setVideos(JSON.parse(saved));
    }
  };

  const saveVideo = (video: VideoJob) => {
    const updated = [video, ...videos];
    setVideos(updated);
    localStorage.setItem('motion_videos', JSON.stringify(updated));
  };

  const handleSubmit = async (prompt: string, voiceId: string) => {
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, voiceId }),
      });

      const data = await res.json();
      console.log('API Response:', data);

      if (!res.ok) {
        alert(`Error: ${data.error || data.message || 'Unknown error'}\n\nDetails: ${JSON.stringify(data, null, 2)}`);
        return;
      }

      if (data.success) {
        setCredits(data.creditsRemaining);
        
        const newJob: VideoJob = {
          id: data.videoId,
          status: data.status,
          prompt,
          created_at: new Date().toISOString(),
        };
        
        setCurrentJob(newJob);
        saveVideo(newJob);
        
        // Start polling for status
        pollStatus(data.videoId);
      } else {
        alert(`Failed: ${data.error || 'Unknown error'}\n\nDetails: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      alert(`Network Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const pollStatus = async (videoId: string) => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/status/${videoId}`);
        const data = await res.json();

        if (data.status === 'completed' || data.status === 'failed') {
          // Update video in list
          const updated = videos.map(v => 
            v.id === videoId 
              ? { ...v, status: data.status, video_url: data.videoUrl }
              : v
          );
          setVideos(updated);
          localStorage.setItem('motion_videos', JSON.stringify(updated));
          
          if (currentJob?.id === videoId) {
            setCurrentJob({ ...currentJob, status: data.status, video_url: data.videoUrl });
          }
          
          return true; // Stop polling
        }

        // Update status
        const updated = videos.map(v => 
          v.id === videoId ? { ...v, status: data.status } : v
        );
        setVideos(updated);
        
        return false; // Continue polling
      } catch (error) {
        console.error('Status check error:', error);
        return true;
      }
    };

    // Poll every 5 seconds
    const interval = setInterval(async () => {
      const shouldStop = await checkStatus();
      if (shouldStop) {
        clearInterval(interval);
      }
    }, 5000);
  };

  const refreshVideo = (videoId: string) => {
    pollStatus(videoId);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-6 h-6 text-pink-500" />
            <span className="font-bold text-xl">Motion</span>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-full">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-sm">{credits} credits</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left: Form */}
          <div className="space-y-8">
            <VideoForm 
              onSubmit={handleSubmit} 
              isLoading={isLoading}
              credits={credits}
            />
          </div>

          {/* Right: Videos */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-300">
              Your Videos
            </h3>
            
            {videos.length === 0 ? (
              <div className="text-center py-12 bg-gray-900/30 rounded-2xl border border-gray-800">
                <Video className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">No videos yet</p>
                <p className="text-sm text-gray-600">Create your first video!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    videoId={video.id}
                    status={video.status}
                    prompt={video.prompt}
                    videoUrl={video.video_url}
                    createdAt={video.created_at}
                    onRefresh={() => refreshVideo(video.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
