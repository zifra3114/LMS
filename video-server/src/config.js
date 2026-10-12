import path from 'node:path';

const list = (value) =>
  String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

/** .env se settings parhta hai. Zaroori cheez missing ho to saaf message ke saath ruk jata hai. */
export function loadConfig(env = process.env) {
  const missing = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'PLAYBACK_SECRET'].filter(
    (name) => !env[name],
  );

  if (missing.length > 0) {
    throw new Error(`.env mein ye cheezein missing hain: ${missing.join(', ')}`);
  }

  if (env.PLAYBACK_SECRET.length < 32) {
    throw new Error('PLAYBACK_SECRET kam az kam 32 characters ka hona chahiye.');
  }

  return {
    port: Number(env.PORT || 3000),
    corsOrigins: list(env.CORS_ORIGIN || 'http://localhost:4200'),
    supabaseUrl: env.SUPABASE_URL,
    supabaseServiceKey: env.SUPABASE_SERVICE_ROLE_KEY,
    adminEmails: list(env.ADMIN_EMAILS).map((email) => email.toLowerCase()),
    playbackSecret: env.PLAYBACK_SECRET,
    playbackTtlHours: Number(env.PLAYBACK_TTL_HOURS || 12),
    storageDir: path.resolve(env.STORAGE_DIR || 'storage'),
    maxUploadBytes: Number(env.MAX_UPLOAD_GB || 10) * 1024 ** 3,
    ffmpegPath: env.FFMPEG_PATH || 'ffmpeg',
    ffprobePath: env.FFPROBE_PATH || 'ffprobe',
  };
}
