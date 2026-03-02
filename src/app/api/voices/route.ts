import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'https://motion-saas-backend-production.up.railway.app';

export async function GET(request: NextRequest) {
  try {
    // Forward to Railway backend
    const backendRes = await fetch(`${BACKEND_URL}/api/voices`);
    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch voices' },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Voices error:', error);
    // Return default voices if backend fails
    return NextResponse.json([
      { id: 'Adam', name: 'Adam', category: 'premade' },
      { id: 'Bella', name: 'Bella', category: 'premade' },
      { id: 'Antoni', name: 'Antoni', category: 'premade' },
      { id: 'Josh', name: 'Josh', category: 'premade' },
      { id: 'Rachel', name: 'Rachel', category: 'premade' },
    ]);
  }
}
