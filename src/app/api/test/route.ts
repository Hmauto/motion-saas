import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({
      status: 'ok',
      message: 'API is running',
      env: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + '...' || 'not set',
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        backendUrl: process.env.BACKEND_URL?.slice(0, 30) + '...' || 'not set',
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
    }, { status: 500 });
  }
}
