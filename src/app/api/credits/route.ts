import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'https://motion-saas-backend-production.up.railway.app';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session_id')?.value || crypto.randomUUID();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // For now, return default credits
    // The backend will handle actual credit tracking
    return NextResponse.json({
      credits: 5,
      isAnonymous: true,
      message: '5 free credits available',
      sessionId: sessionId
    });

  } catch (error) {
    console.error('Credits check error:', error);
    // Return default on error
    return NextResponse.json({
      credits: 5,
      isAnonymous: true,
      message: '5 free credits available',
    });
  }
}
