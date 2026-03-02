import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session_id')?.value;
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';

    if (!sessionId) {
      return NextResponse.json({
        credits: 5,
        isAnonymous: true,
        message: '5 free credits available',
      });
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('credits, email, is_paid')
      .eq('session_ip', `${sessionId}:${ip}`)
      .single();

    if (!user) {
      return NextResponse.json({
        credits: 5,
        isAnonymous: true,
        message: '5 free credits available',
      });
    }

    return NextResponse.json({
      credits: user.credits,
      isAnonymous: !user.email,
      isPaid: user.is_paid,
      message: user.email 
        ? `You have ${user.credits} credits` 
        : `5 free credits (Login for 5 more)`,
    });

  } catch (error) {
    console.error('Credits check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
