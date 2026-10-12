import crypto from 'node:crypto';

// ---------- Playback token ----------
// Student pehle Supabase login se token maangta hai (batch aur Published check ke baad).
// Phir har playlist / segment request mein sirf yeh chhota token jata hai, jise
// server bina database ke, sirf mohar (HMAC) se check kar leta hai. Isliye 4 ghante
// ki lecture ki hazaaron segment requests par Supabase par load nahi parta.

const sign = (payload, secret) =>
  crypto.createHmac('sha256', secret).update(payload).digest();

export function signPlaybackToken({ lectureId, userId }, secret, ttlSeconds, now = Date.now()) {
  const payload = Buffer.from(
    JSON.stringify({ l: lectureId, u: userId, e: Math.floor(now / 1000) + ttlSeconds }),
  ).toString('base64url');

  return `${payload}.${sign(payload, secret).toString('base64url')}`;
}

export function verifyPlaybackToken(token, lectureId, secret, now = Date.now()) {
  if (typeof token !== 'string') return null;

  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra !== undefined) return null;

  const expected = sign(payload, secret);
  const given = Buffer.from(signature, 'base64url');

  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    return null;
  }

  let data;
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (data.l !== lectureId || typeof data.e !== 'number' || data.e * 1000 < now) {
    return null;
  }

  return data;
}

// ---------- Login check (Supabase JWT) ----------

export function createAuth({ db, config }) {
  const admins = new Set(config.adminEmails);

  async function resolveUser(req) {
    const match = (req.headers.authorization || '').match(/^Bearer (.+)$/i);
    if (!match) return null;

    const user = await db.getUserFromToken(match[1]);
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      isAdmin: !!user.email && admins.has(user.email.toLowerCase()),
    };
  }

  return {
    async requireUser(req, res, next) {
      const user = await resolveUser(req);
      if (!user) return res.status(401).json({ error: 'Dobara login karein.' });

      req.user = user;
      next();
    },

    async requireAdmin(req, res, next) {
      const user = await resolveUser(req);
      if (!user) return res.status(401).json({ error: 'Dobara login karein.' });
      if (!user.isAdmin) {
        return res.status(403).json({ error: 'Sirf admin ye kaam kar sakta hai.' });
      }

      req.user = user;
      next();
    },
  };
}
