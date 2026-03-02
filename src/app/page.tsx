import { Video, Sparkles, Zap, Shield } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-pink-500/10 via-transparent to-transparent" />
        
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-pink-500" />
            <span className="text-sm text-gray-300">5 free videos, no signup required</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-pink-200 to-violet-200 bg-clip-text text-transparent">
            Motion Graphics
            <br />
            <span className="text-pink-500">Powered by AI</span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Describe your idea, our AI creates stunning motion graphics videos.
            No design skills needed. 5 free credits to start.
          </p>
          
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-8 py-4 bg-pink-500 text-white font-semibold rounded-full hover:bg-pink-600 transition-colors"
          >
            <Video className="w-5 h-5" />
            Create Your Video
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-gray-800">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-gray-900/30 rounded-2xl border border-gray-800">
            <Zap className="w-10 h-10 text-pink-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">AI-Powered</h3>
            <p className="text-gray-400">
              Our sub-agent system analyzes your prompt, designs visuals, generates voiceover, and renders the complete video.
            </p>
          </div>
          
          <div className="p-6 bg-gray-900/30 rounded-2xl border border-gray-800">
            <Video className="w-10 h-10 text-violet-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Abstract Motion</h3>
            <p className="text-gray-400">
              Not just text on screen. Real motion graphics with particles, shapes, waves, and dynamic animations.
            </p>
          </div>
          
          <div className="p-6 bg-gray-900/30 rounded-2xl border border-gray-800">
            <Shield className="w-10 h-10 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">5 Free Credits</h3>
            <p className="text-gray-400">
              Try it free with 5 videos. No credit card required. Login to get 5 more. Pay only for what you use.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-6 py-20 border-t border-gray-800">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Simple Pricing</h2>
          <p className="text-gray-400">Pay per video, no subscriptions</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-gray-900/30 rounded-2xl border border-gray-800 text-center">
            <p className="text-gray-400 mb-2">10 Videos</p>
            <p className="text-4xl font-bold mb-4">$5</p>
            <p className="text-gray-500 text-sm">$0.50 per video</p>
          </div>
          
          <div className="p-6 bg-gray-900/50 rounded-2xl border border-pink-500/50 text-center relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-pink-500 text-xs font-medium rounded-full">
              Popular
            </div>
            <p className="text-gray-400 mb-2">50 Videos</p>
            <p className="text-4xl font-bold mb-4">$20</p>
            <p className="text-gray-500 text-sm">$0.40 per video</p>
          </div>
          
          <div className="p-6 bg-gray-900/30 rounded-2xl border border-gray-800 text-center">
            <p className="text-gray-400 mb-2">200 Videos</p>
            <p className="text-4xl font-bold mb-4">$60</p>
            <p className="text-gray-500 text-sm">$0.30 per video</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center border-t border-gray-800">
        <h2 className="text-3xl font-bold mb-6">Ready to create?</h2>
        <p className="text-gray-400 mb-8">
          Start with 5 free videos. No credit card required.
        </p>
        
        <Link
          href="/create"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-violet-500 text-white font-semibold rounded-full hover:opacity-90 transition-opacity"
        >
          <Sparkles className="w-5 h-5" />
          Start Creating Free
        </Link>
      </section>
    </div>
  );
}
