import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test Supabase connection
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Supabase connection failed',
        error: error.message,
        env: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + '...',
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Supabase connected successfully',
      data,
      env: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + '...',
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
