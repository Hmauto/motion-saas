import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'https://motion-saas-backend-production.up.railway.app';

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { videoId } = params;

    // Forward to Railway backend
    const backendRes = await fetch(`${BACKEND_URL}/api/status/${videoId}`);
    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data.error || 'Video not found' },
        { status: backendRes.status }
      );
    }

    return NextResponse.json({
      status: data.status,
      videoUrl: data.videoUrl,
      audioUrl: data.audioUrl,
      script: data.script,
      errorMessage: data.errorMessage,
      progress: data.progress,
    });

  } catch (error: any) {
    console.error('Status error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
