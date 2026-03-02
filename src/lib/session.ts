// Session management for anonymous users
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

const SESSION_COOKIE = 'motion_session_id';
const SESSION_EXPIRY = 60 * 60 * 24 * 30; // 30 days

export function getSessionId(): string {
  const cookieStore = cookies();
  let sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  
  if (!sessionId) {
    sessionId = uuidv4();
    cookieStore.set(SESSION_COOKIE, sessionId, {
      maxAge: SESSION_EXPIRY,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }
  
  return sessionId;
}

export function getClientSessionId(): string | null {
  // For client-side usage
  const match = document.cookie.match(new RegExp('(^| )' + SESSION_COOKIE + '=([^;]+)'));
  return match ? match[2] : null;
}
