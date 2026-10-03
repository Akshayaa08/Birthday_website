import crypto from 'crypto';

export const SESSION_COOKIE = 'birthday_session';
const SESSION_DURATION_SECONDS = 12 * 60 * 60;

export function assertAuthConfiguration() {
  const { OWNER_PASSWORD, BOYFRIEND_PASSWORD, SESSION_SECRET } = process.env;
  if (!OWNER_PASSWORD || OWNER_PASSWORD.length < 12) {
    throw new Error('OWNER_PASSWORD must be set to at least 12 characters.');
  }
  if (!BOYFRIEND_PASSWORD || BOYFRIEND_PASSWORD.length < 12) {
    throw new Error('BOYFRIEND_PASSWORD must be set to at least 12 characters.');
  }
  if (!SESSION_SECRET || Buffer.byteLength(SESSION_SECRET) < 32) {
    throw new Error('SESSION_SECRET must be set to at least 32 bytes.');
  }
}

export function createSessionToken(role) {
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    userId: role.toLowerCase(),
    role,
    username: role === 'OWNER' ? 'System' : 'My Love',
    exp: now + SESSION_DURATION_SECONDS,
  })).toString('base64url');
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

function sign(payload) {
  return crypto.createHmac('sha256', process.env.SESSION_SECRET).update(payload).digest('base64url');
}

function readCookie(req, name) {
  const cookies = (req.headers.cookie || '').split(';');
  const cookie = cookies.find((entry) => entry.trim().startsWith(`${name}=`));
  return cookie ? cookie.trim().slice(name.length + 1) : null;
}

export function optionalAuth(req, res, next) {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token) return next();

  const separator = token.lastIndexOf('.');
  if (separator < 0) return next();
  const payload = token.slice(0, separator);
  const providedSignature = Buffer.from(token.slice(separator + 1));
  const expectedSignature = Buffer.from(sign(payload));

  if (providedSignature.length !== expectedSignature.length || !crypto.timingSafeEqual(providedSignature, expectedSignature)) {
    return next();
  }

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (session.exp > Date.now() / 1000 && ['OWNER', 'BOYFRIEND'].includes(session.role)) {
      req.user = {
        userId: session.userId,
        role: session.role,
        username: session.role === 'OWNER' ? 'System' : 'My Love',
      };
    }
  } catch {
    // Invalid cookies are treated as unauthenticated.
  }

  return next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  return next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'You are not allowed to access this resource.' });
    return next();
  };
}

export function verifyRequestOrigin(req, res, next) {
  const origin = req.get('origin');
  const configuredOrigin = process.env.CLIENT_URL;
  if (origin && configuredOrigin) {
    try {
      if (new URL(origin).origin !== new URL(configuredOrigin).origin) {
        return res.status(403).json({ error: 'Request origin is not allowed.' });
      }
    } catch {
      return res.status(403).json({ error: 'Request origin is not allowed.' });
    }
  }
  return next();
}

export function sessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'strict',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS * 1000,
  };
}
