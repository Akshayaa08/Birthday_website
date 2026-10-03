import crypto from 'crypto';
import express from 'express';
import {
  createSessionToken,
  optionalAuth,
  requireAuth,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifyRequestOrigin,
} from '../middleware/auth.js';

const router = express.Router();
const failedAttempts = new Map();
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 10;

function passwordMatches(candidate, expected) {
  const candidateHash = crypto.createHash('sha256').update(candidate).digest();
  const expectedHash = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(candidateHash, expectedHash);
}

router.post('/login', verifyRequestOrigin, (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || !username.trim() || typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }
  if (password.length > 512) {
    return res.status(400).json({ error: 'Password is too long.' });
  }

  const clientAddress = req.ip;
  const attempt = failedAttempts.get(clientAddress);
  if (attempt && attempt.expiresAt > Date.now() && attempt.count >= MAX_FAILED_ATTEMPTS) {
    return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
  }
  const normalizedUsername = username.trim().toUpperCase();
  const role = normalizedUsername === 'CAZOMON'
    ? 'OWNER'
    : normalizedUsername === 'RASAGULLA'
      ? 'BOYFRIEND'
      : null;
  const expectedPassword = role === 'OWNER'
    ? process.env.OWNER_PASSWORD
    : role === 'BOYFRIEND'
      ? process.env.BOYFRIEND_PASSWORD
      : null;

  if (!expectedPassword || !passwordMatches(password, expectedPassword)) {
    const current = attempt && attempt.expiresAt > Date.now() ? attempt : { count: 0, expiresAt: Date.now() + ATTEMPT_WINDOW_MS };
    failedAttempts.set(clientAddress, { ...current, count: current.count + 1 });
    return res.status(401).json({ error: 'Username or password is incorrect.' });
  }

  failedAttempts.delete(clientAddress);
  res.cookie(SESSION_COOKIE, createSessionToken(role), sessionCookieOptions());
  return res.json({ user: { userId: role.toLowerCase(), role, username: role === 'OWNER' ? 'System' : 'My Love' } });
});

router.post('/logout', verifyRequestOrigin, (req, res) => {
  res.clearCookie(SESSION_COOKIE, sessionCookieOptions());
  return res.json({ success: true });
});

router.get('/me', optionalAuth, (req, res) => {
  return res.json({ user: req.user || null });
});

router.get('/session', optionalAuth, requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

export default router;
