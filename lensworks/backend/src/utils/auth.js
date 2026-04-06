import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { env } from '../config/env.js';

const ACCESS_COOKIE = 'lw_access_token';
const SESSION_COOKIE = 'lw_sid';

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7
  };
}

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
      fullName: user.fullName
    },
    env.jwtAccessSecret,
    { expiresIn: '7d' }
  );
}

export function setAuthCookie(res, user) {
  const token = signAccessToken(user);
  res.cookie(ACCESS_COOKIE, token, cookieOptions());
  return token;
}

export function clearAuthCookie(res) {
  const options = cookieOptions();
  delete options.maxAge;
  res.clearCookie(ACCESS_COOKIE, options);
}

export function readAuthUser(req) {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, env.jwtAccessSecret);
    return {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
      fullName: payload.fullName
    };
  } catch {
    return null;
  }
}

export function getOrCreateSessionId(req, res) {
  const existing = req.cookies?.[SESSION_COOKIE];
  if (existing) {
    return existing;
  }

  const sessionId = randomUUID();
  res.cookie(SESSION_COOKIE, sessionId, cookieOptions());
  return sessionId;
}
