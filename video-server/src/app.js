import path from 'node:path';
import fsp from 'node:fs/promises';
import express from 'express';
import cors from 'cors';
import { createAuth, signPlaybackToken, verifyPlaybackToken } from './auth.js';
import { fileSize, readJson, removePath } from './storage.js';

const ALLOWED_EXTENSIONS = new Set(['.mp4', '.m4v', '.mov', '.mkv', '.webm', '.avi']);

function parseId(req, res, next) {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid lecture ID.' });
  }

  req.lectureId = id;
  next();
}

export function createApp({ config, db, storage, processor }) {
  const app = express();
  const auth = createAuth({ db, config });

  // Chunk ki body raw bytes mein aati hai (client 8 MB ke tukron mein bhejta hai)
  const rawChunk = express.raw({ type: () => true, limit: '32mb' });

  app.disable('x-powered-by');
  app.use(
    cors({
      origin: config.corsOrigins,
      methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Authorization', 'Content-Type'],
      maxAge: 600,
    }),
  );

  app.get('/health', (_req, res) => res.json({ ok: true }));

  // ======================================================================
  // ADMIN: video upload (tukron mein, beech mein toot jaye to wahin se jaari)
  // ======================================================================

  // Kitna upload ho chuka hai (resume ke liye)
  app.get('/api/lectures/:id/upload', auth.requireAdmin, parseId, async (req, res) => {
    const id = req.lectureId;
    const meta = await readJson(storage.metaPath(id));

    res.json({
      received: await fileSize(storage.partPath(id)),
      total: meta?.total ?? null,
      filename: meta?.filename ?? null,
    });
  });

  // Ek tukra (offset = ab tak kitne bytes aa chuke)
  app.post('/api/lectures/:id/upload', auth.requireAdmin, parseId, rawChunk, async (req, res) => {
    const id = req.lectureId;
    const offset = Number(req.query.offset);
    const total = Number(req.query.total);
    const filename = String(req.query.filename || '');
    const chunk = req.body;

    if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(total) || total <= 0) {
      return res.status(400).json({ error: 'Invalid upload offset or total size.' });
    }

    if (!ALLOWED_EXTENSIONS.has(path.extname(filename).toLowerCase())) {
      return res.status(400).json({ error: 'Unsupported file type. Please upload an MP4, M4V, MOV, MKV, WEBM or AVI video.' });
    }

    if (total > config.maxUploadBytes) {
      const gb = Math.round(config.maxUploadBytes / 1024 ** 3);
      return res.status(413).json({ error: `The video cannot be larger than ${gb} GB.` });
    }

    if (!Buffer.isBuffer(chunk) || chunk.length === 0) {
      return res.status(400).json({ error: 'Empty upload chunk.' });
    }

    const lecture = await db.getLecture(id);
    if (!lecture) return res.status(404).json({ error: 'Lecture not found.' });

    if (lecture.processing_status === 'Processing') {
      return res.status(409).json({ error: 'This video is still being processed. Please wait until it finishes.' });
    }

    const part = storage.partPath(id);

    if (offset === 0) {
      // Nayi upload: purani adhoori file mita kar shuru
      await fsp.writeFile(part, chunk);
      await fsp.writeFile(storage.metaPath(id), JSON.stringify({ filename, total }));

      // Pehle se Ready lecture ki video badal rahe hon to purani chalti rehne dein
      if (lecture.processing_status !== 'Ready') {
        await db.updateLecture(id, {
          processing_status: 'Uploading',
          processing_progress: 0,
          processing_error: null,
        });
      }

      return res.json({ received: chunk.length });
    }

    const current = await fileSize(part);
    const meta = await readJson(storage.metaPath(id));

    if (!meta || meta.total !== total || meta.filename !== filename) {
      return res.status(409).json({ error: 'This is not the same file that was being uploaded.' });
    }

    if (offset !== current) {
      // Client ko bata do server ke paas kitna hai, wo wahin se bhejega
      return res.status(409).json({ error: 'Upload offset mismatch.', received: current });
    }

    if (current + chunk.length > total) {
      return res.status(400).json({ error: 'The chunk exceeds the declared file size.' });
    }

    await fsp.appendFile(part, chunk);
    res.json({ received: current + chunk.length });
  });

  // Upload mukammal: ab FFmpeg ko convert karne ko do
  app.post('/api/lectures/:id/upload/complete', auth.requireAdmin, parseId, async (req, res) => {
    const id = req.lectureId;
    const meta = await readJson(storage.metaPath(id));
    const received = await fileSize(storage.partPath(id));

    if (!meta || received !== meta.total) {
      return res.status(409).json({ error: 'The upload is not complete yet.', received });
    }

    await fsp.rename(storage.partPath(id), storage.sourcePath(id));
    await removePath(storage.metaPath(id));

    await db.updateLecture(id, {
      processing_status: 'Processing',
      processing_progress: 0,
      processing_error: null,
    });

    processor.enqueue(id);
    res.status(202).json({ status: 'Processing' });
  });

  // Lecture delete hone par: video ki saari files mita do
  app.delete('/api/lectures/:id/video', auth.requireAdmin, parseId, async (req, res) => {
    const id = req.lectureId;

    processor.cancel(id);

    await Promise.all([
      removePath(storage.hlsDir(id)),
      removePath(storage.hlsNewDir(id)),
      removePath(storage.partPath(id)),
      removePath(storage.metaPath(id)),
      removePath(storage.sourcePath(id)),
    ]);

    res.status(204).end();
  });

  // ======================================================================
  // PLAYBACK: pehle ijazat (login + batch + Published), phir token, phir segments
  // ======================================================================

  app.post('/api/lectures/:id/playback', auth.requireUser, parseId, async (req, res) => {
    const id = req.lectureId;
    const lecture = await db.getLecture(id);

    if (!lecture) return res.status(404).json({ error: 'Lecture not found.' });

    if (!req.user.isAdmin) {
      // Student ko Drafted lecture ka pata hi na chale
      if (lecture.status !== 'Published') {
        return res.status(404).json({ error: 'Lecture not found.' });
      }

      if (!(await db.isBatchMember(req.user.id, lecture.batch_id))) {
        return res.status(403).json({ error: 'This lecture does not belong to your batch.' });
      }
    }

    if (lecture.processing_status !== 'Ready') {
      return res.status(409).json({ error: 'This video is not ready yet.' });
    }

    const ttlSeconds = Math.round(config.playbackTtlHours * 3600);
    const token = signPlaybackToken(
      { lectureId: id, userId: req.user.id },
      config.playbackSecret,
      ttlSeconds,
    );

    res.json({ playlistPath: `/hls/${id}/index.m3u8?t=${token}`, expiresIn: ttlSeconds });
  });

  // Playlist aur segments. Sirf theek token wale ko milte hain.
  app.get('/hls/:id/:file', parseId, async (req, res) => {
    const id = req.lectureId;
    const { file } = req.params;

    if (!/^[A-Za-z0-9_-]+\.(m3u8|ts)$/.test(file)) {
      return res.status(404).end();
    }

    const token = typeof req.query.t === 'string' ? req.query.t : '';

    if (!verifyPlaybackToken(token, id, config.playbackSecret)) {
      return res.status(401).json({ error: 'The playback link is invalid or has expired.' });
    }

    const dir = storage.hlsDir(id);

    if (file.endsWith('.m3u8')) {
      let text;
      try {
        text = await fsp.readFile(path.join(dir, file), 'utf8');
      } catch {
        return res.status(404).end();
      }

      // Har segment ke link ke saath token laga do (Safari ka apna player header nahi bhej sakta)
      const body = text
        .split(/\r?\n/)
        .map((line) => (line && !line.startsWith('#') ? `${line}?t=${token}` : line))
        .join('\n');

      return res
        .set({ 'Content-Type': 'application/vnd.apple.mpegurl', 'Cache-Control': 'no-store' })
        .send(body);
    }

    res.set({ 'Content-Type': 'video/mp2t', 'Cache-Control': 'private, max-age=3600' });

    res.sendFile(file, { root: dir, acceptRanges: true, dotfiles: 'deny' }, (error) => {
      if (error && !res.headersSent) {
        res.status(error.statusCode === 404 ? 404 : 500).end();
      }
    });
  });

  // ======================================================================

  app.use((error, _req, res, next) => {
    if (res.headersSent) return next(error);

    const status = error.status && error.status < 500 ? error.status : 500;
    if (status === 500) console.error(error);

    res.status(status).json({
      error: status === 500 ? 'Something went wrong on the server. Please try again.' : error.message,
    });
  });

  return app;
}
