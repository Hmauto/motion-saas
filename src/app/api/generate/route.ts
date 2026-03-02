import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { runVideoPipeline } from '@/lib/pipeline';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Get or create user based on session/IP
async function getOrCreateUser(sessionId: string, ip: string, email?: string) {
  // Try to find existing user by session
  const { data: existingSession } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (existingSession) {
    return existingSession;
  }

  // Try to find by email if provided
  if (email) {
    const { data: existingEmail } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingEmail) {
      // Update session
      await supabaseAdmin
        .from('users')
        .update({ session_id: sessionId, ip_address: ip })
        .eq('id', existingEmail.id);
      return { ...existingEmail, session_id: sessionId };
    }
  }

  // Check if IP already used (prevent multiple free accounts)
  const { data: existingIp } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('ip_address', ip)
    .eq('is_anonymous', true)
    .single();

  if (existingIp && !email) {
    // Reuse existing IP user
    await supabaseAdmin
      .from('users')
      .update({ session_id: sessionId })
      .eq('id', existingIp.id);
    return { ...existingIp, session_id: sessionId };
  }

  // Create new user with free credits
  const credits = email ? 10 : 5; // 5 for anonymous, 10 for logged in

  const { data: newUser, error } = await supabaseAdmin
    .from('users')
    .insert({
      email: email || null,
      session_id: sessionId,
      ip_address: ip,
      credits,
      is_anonymous: !email,
    })
    .select()
    .single();

  if (error) throw error;

  // Log credit transaction
  await supabaseAdmin.from('credit_transactions').insert({
    user_id: newUser.id,
    amount: credits,
    type: email ? 'login_bonus' : 'free_signup',
    description: `Initial ${credits} free credits`,
  });

  return newUser;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, email } = body;

    if (!prompt || prompt.trim().length < 10) {
      return NextResponse.json(
        { error: 'Prompt must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Get session and IP
    const sessionId = request.cookies.get('session_id')?.value || crypto.randomUUID();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Get or create user
    const user = await getOrCreateUser(sessionId, ip, email);

    // Check credits
    if (user.credits < 1) {
      return NextResponse.json(
        { error: 'No credits remaining', code: 'NO_CREDITS' },
        { status: 403 }
      );
    }

    // Deduct credit
    const { error: creditError } = await supabaseAdmin
      .from('users')
      .update({ credits: user.credits - 1 })
      .eq('id', user.id);

    if (creditError) {
      return NextResponse.json(
        { error: 'Failed to deduct credit' },
        { status: 500 }
      );
    }

    // Log transaction
    await supabaseAdmin.from('credit_transactions').insert({
      user_id: user.id,
      amount: -1,
      type: 'video_generation',
      description: 'Video generation started',
    });

    // Create video record
    const { data: video, error: videoError } = await supabaseAdmin
      .from('videos')
      .insert({
        user_id: user.id,
        session_id: sessionId,
        prompt: prompt.trim(),
        status: 'pending',
        credits_used: 1,
      })
      .select()
      .single();

    if (videoError) throw videoError;

    // Start pipeline in background (don't await)
    runVideoPipeline({ videoId: video.id, prompt: prompt.trim() })
      .catch(err => console.error('Pipeline error:', err));

    // Return response immediately
    const response = NextResponse.json({
      success: true,
      videoId: video.id,
      status: 'pending',
      creditsRemaining: user.credits - 1,
      estimatedTime: '3-5 minutes',
    });

    // Set session cookie if not exists
    if (!request.cookies.get('session_id')) {
      response.cookies.set('session_id', sessionId, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }

    return response;

  } catch (error: any) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
