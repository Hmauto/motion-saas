import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, User, Video } from '@/lib/supabase';
import { spawnPromptAnalyzer } from '@/lib/subagents';
import crypto from 'crypto';

// Get or create user based on session/IP
async function getOrCreateUser(sessionId: string, ip: string, email?: string): Promise<User> {
  // Try to find existing user by session
  const { data: existingSession } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('session_ip', `${sessionId}:${ip}`)
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
      // Update session IP
      await supabaseAdmin
        .from('users')
        .update({ session_ip: `${sessionId}:${ip}` })
        .eq('id', existingEmail.id);
      return existingEmail;
    }
  }

  // Create new user with free credits
  const credits = email ? 10 : 5; // 5 for anonymous, 10 for logged in

  const { data: newUser, error } = await supabaseAdmin
    .from('users')
    .insert({
      email,
      credits,
      session_ip: `${sessionId}:${ip}`,
    })
    .select()
    .single();

  if (error) throw error;

  // Log credit transaction
  await supabaseAdmin.from('credit_transactions').insert({
    user_id: newUser.id,
    amount: credits,
    type: 'free',
    description: `Initial ${credits} free credits`,
  });

  return newUser;
}

// Deduct credit
async function deductCredit(userId: string): Promise<boolean> {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('credits')
    .eq('id', userId)
    .single();

  if (!user || user.credits < 1) {
    return false;
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update({ credits: user.credits - 1 })
    .eq('id', userId);

  if (error) return false;

  // Log transaction
  await supabaseAdmin.from('credit_transactions').insert({
    user_id: userId,
    amount: -1,
    type: 'usage',
    description: 'Video generation',
  });

  return true;
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
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';

    // Get or create user
    const user = await getOrCreateUser(sessionId, ip as string, email);

    // Check credits
    if (user.credits < 1) {
      return NextResponse.json(
        { error: 'No credits remaining', code: 'NO_CREDITS' },
        { status: 403 }
      );
    }

    // Deduct credit
    const deducted = await deductCredit(user.id);
    if (!deducted) {
      return NextResponse.json(
        { error: 'Failed to deduct credit' },
        { status: 500 }
      );
    }

    // Create video record
    const { data: video, error: videoError } = await supabaseAdmin
      .from('videos')
      .insert({
        user_id: user.id,
        session_id: sessionId,
        prompt: prompt.trim(),
        status: 'pending',
      })
      .select()
      .single();

    if (videoError) throw videoError;

    // Start sub-agent workflow
    // Step 1: Analyze prompt
    const analysisResult = await spawnPromptAnalyzer(video.id, prompt);
    
    if (!analysisResult.success) {
      await supabaseAdmin
        .from('videos')
        .update({ status: 'failed' })
        .eq('id', video.id);
      
      return NextResponse.json(
        { error: 'Failed to analyze prompt' },
        { status: 500 }
      );
    }

    // Update video with analysis
    await supabaseAdmin
      .from('videos')
      .update({
        status: 'analyzing',
        art_direction: { analysis: analysisResult.data },
      })
      .eq('id', video.id);

    // Return response
    const response = NextResponse.json({
      success: true,
      videoId: video.id,
      status: 'analyzing',
      creditsRemaining: user.credits - 1,
      estimatedTime: '2-3 minutes',
    });

    // Set session cookie if not exists
    if (!request.cookies.get('session_id')) {
      response.cookies.set('session_id', sessionId, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
    }

    return response;

  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
