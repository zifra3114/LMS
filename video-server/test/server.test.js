import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createStorage, exists } from '../src/storage.js';
import { createProcessor, planTranscode } from '../src/processor.js';
import { createApp } from '../src/app.js';
import { signPlaybackToken, verifyPlaybackToken } from '../src/auth.js';

const SECRET = 'x'.repeat(40);

let tmp;
let server;
let base;
let storage;
let processor;
let lectures;

const users = {
  'admin-token': { id: 'u-admin', email: 'Admin@Example.com' },
  'member-token': { id: 'u-member', email: 'member@example.com' },
  'outsider-token': { id: 'u-outsider', email: 'outsider@example.com' },
};

// Supabase ki jagah chhota nakli database
const fakeDb = {
  async getUserFromToken(token) {
    return users[token] ?? null;
  },
  async getLecture(id) {
    return lectures.get(id) ? { ...lectures.get(id) } : null;
  },
  async updateLecture(id, patch) {
    const row = lectures.get(id);
    if (row) Object.assign(row, patch);
  },
  async isBatchMember(userId, batchId) {
    return userId === 'u-member' && batchId === 1;
  },
  async listProcessingIds() {
    return [];
  },
};

const auth = (token) => ({ Authorization: `Bearer ${token}` });

function makeVideo(file, args) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args, file]);
}

async function upload(id, file, { chunkSize, token = 'admin-token' }) {
  const bytes = await fsp.readFile(file);
  const name = path.basename(file);
  let offset = 0;

  while (offset < bytes.length) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    const res = await fetch(
      `${base}/api/lectures/${id}/upload?offset=${offset}&total=${bytes.length}&filename=${name}`,
      { method: 'POST', headers: { ...auth(token), 'Content-Type': 'application/octet-stream' }, body: chunk },
    );
    if (!res.ok) return res;
    offset = (await res.json()).received;
  }

  return fetch(`${base}/api/lectures/${id}/upload/complete`, { method: 'POST', headers: auth(token) });
}

before(async () => {
  tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'lms-video-test-'));

  const config = {
    corsOrigins: ['http://localhost:4200'],
    adminEmails: ['admin@example.com'],
    playbackSecret: SECRET,
    playbackTtlHours: 12,
    maxUploadBytes: 1024 ** 3,
    ffmpegPath: 'ffmpeg',
    ffprobePath: 'ffprobe',
  };

  storage = createStorage(path.join(tmp, 'storage'));
  await storage.ensure();
  processor = createProcessor({ config, storage, db: fakeDb, log: { log() {}, error() {} } });
  lectures = new Map();

  const app = createApp({ config, db: fakeDb, storage, processor });
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;

  // 1: H.264 + AAC (sirf copy hona chahiye), 2: MPEG-4 video (encode hona chahiye)
  makeVideo(path.join(tmp, 'good.mp4'), [
    '-f', 'lavfi', '-i', 'testsrc=duration=14:size=320x240:rate=25',
    '-f', 'lavfi', '-i', 'sine=frequency=440:duration=14',
    '-c:v', 'libx264', '-g', '50', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
  ]);
  makeVideo(path.join(tmp, 'old.mkv'), [
    '-f', 'lavfi', '-i', 'testsrc=duration=8:size=320x240:rate=25',
    '-f', 'lavfi', '-i', 'sine=frequency=440:duration=8',
    '-c:v', 'mpeg4', '-c:a', 'aac',
  ]);
  await fsp.writeFile(path.join(tmp, 'notes.txt'), 'not a video');
  await fsp.writeFile(path.join(tmp, 'fake.mp4'), 'this is not really a video');
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await fsp.rm(tmp, { recursive: true, force: true });
});

test('planTranscode: sirf browser-safe cheezein copy hoti hain', () => {
  assert.deepEqual(
    planTranscode({ video: { codec_name: 'h264', pix_fmt: 'yuv420p' }, audio: { codec_name: 'aac' } }),
    { copyVideo: true, copyAudio: true },
  );
  assert.deepEqual(
    planTranscode({ video: { codec_name: 'hevc', pix_fmt: 'yuv420p' }, audio: { codec_name: 'opus' } }),
    { copyVideo: false, copyAudio: false },
  );
  assert.equal(planTranscode({ video: { codec_name: 'h264', pix_fmt: 'yuv444p' } }).copyVideo, false);
});

test('playback token: theek, ghalat lecture, badla hua, expire', () => {
  const token = signPlaybackToken({ lectureId: 5, userId: 'u' }, SECRET, 60);
  assert.equal(verifyPlaybackToken(token, 5, SECRET)?.u, 'u');
  assert.equal(verifyPlaybackToken(token, 6, SECRET), null);
  assert.equal(verifyPlaybackToken(token, 5, 'y'.repeat(40)), null);
  assert.equal(verifyPlaybackToken(token.slice(0, -2) + 'xx', 5, SECRET), null);
  assert.equal(verifyPlaybackToken(token, 5, SECRET, Date.now() + 61_000), null);
  assert.equal(verifyPlaybackToken('garbage', 5, SECRET), null);
  assert.equal(verifyPlaybackToken(undefined, 5, SECRET), null);
});

test('upload: login aur admin zaroori, ghalat file / id rad', async () => {
  lectures.set(1, { id: 1, batch_id: 1, status: 'Published', processing_status: 'Pending' });

  const url = `${base}/api/lectures/1/upload?offset=0&total=10&filename=a.mp4`;
  const post = (headers) => fetch(url, { method: 'POST', headers, body: Buffer.from('0123456789') });

  assert.equal((await post({})).status, 401);
  assert.equal((await post(auth('member-token'))).status, 403);
  assert.equal((await post(auth('nobody'))).status, 401);

  const badExt = await fetch(`${base}/api/lectures/1/upload?offset=0&total=10&filename=a.exe`, {
    method: 'POST',
    headers: auth('admin-token'),
    body: Buffer.from('0123456789'),
  });
  assert.equal(badExt.status, 400);

  const badId = await fetch(`${base}/api/lectures/..%2F..%2Fetc/upload`, { headers: auth('admin-token') });
  assert.equal(badId.status, 400);

  const missing = await fetch(`${base}/api/lectures/999/upload?offset=0&total=10&filename=a.mp4`, {
    method: 'POST',
    headers: auth('admin-token'),
    body: Buffer.from('0123456789'),
  });
  assert.equal(missing.status, 404);
});

test('upload: tukron mein, resume aur galat offset', async () => {
  lectures.set(2, { id: 2, batch_id: 1, status: 'Published', processing_status: 'Pending' });
  const bytes = await fsp.readFile(path.join(tmp, 'good.mp4'));
  const head = `filename=good.mp4&total=${bytes.length}`;
  const send = (offset, chunk) =>
    fetch(`${base}/api/lectures/2/upload?offset=${offset}&${head}`, {
      method: 'POST',
      headers: { ...auth('admin-token'), 'Content-Type': 'application/octet-stream' },
      body: chunk,
    });

  const first = await send(0, bytes.subarray(0, 1000));
  assert.equal((await first.json()).received, 1000);
  assert.equal(lectures.get(2).processing_status, 'Uploading');

  // galat offset: server bata deta hai kitna hai
  const wrong = await send(5000, bytes.subarray(5000, 6000));
  assert.equal(wrong.status, 409);
  assert.equal((await wrong.json()).received, 1000);

  // status endpoint se resume point
  const status = await (await fetch(`${base}/api/lectures/2/upload`, { headers: auth('admin-token') })).json();
  assert.deepEqual(status, { received: 1000, total: bytes.length, filename: 'good.mp4' });

  // upload adhoori ho to complete rad
  const early = await fetch(`${base}/api/lectures/2/upload/complete`, { method: 'POST', headers: auth('admin-token') });
  assert.equal(early.status, 409);

  // baqi file wahin se bhejo
  const rest = await send(1000, bytes.subarray(1000));
  assert.equal((await rest.json()).received, bytes.length);

  const done = await fetch(`${base}/api/lectures/2/upload/complete`, { method: 'POST', headers: auth('admin-token') });
  assert.equal(done.status, 202);

  await processor.idle();
  assert.equal(lectures.get(2).processing_status, 'Ready', lectures.get(2).processing_error);
  assert.equal(lectures.get(2).processing_progress, 100);
  assert.equal(lectures.get(2).duration_minutes, 1);
  assert.equal(await exists(storage.sourcePath(2)), false, 'source file saaf honi chahiye');
  assert.equal(await exists(path.join(storage.hlsDir(2), 'index.m3u8')), true);
});

test('playback: kaun dekh sakta hai', async () => {
  const playback = (id, token) =>
    fetch(`${base}/api/lectures/${id}/playback`, { method: 'POST', headers: token ? auth(token) : {} });

  assert.equal((await playback(2)).status, 401);
  assert.equal((await playback(2, 'outsider-token')).status, 403);
  assert.equal((await playback(2, 'member-token')).status, 200);
  assert.equal((await playback(2, 'admin-token')).status, 200);

  lectures.get(2).status = 'Drafted';
  assert.equal((await playback(2, 'member-token')).status, 404, 'Drafted student ko nahi dikhna chahiye');
  assert.equal((await playback(2, 'admin-token')).status, 200, 'admin Drafted dekh sakta hai');
  lectures.get(2).status = 'Published';

  lectures.set(3, { id: 3, batch_id: 1, status: 'Published', processing_status: 'Processing' });
  assert.equal((await playback(3, 'member-token')).status, 409);
  assert.equal((await playback(404, 'member-token')).status, 404);
});

test('hls: playlist, segments, range, token ke bina band', async () => {
  const { playlistPath } = await (
    await fetch(`${base}/api/lectures/2/playback`, { method: 'POST', headers: auth('member-token') })
  ).json();

  const playlist = await fetch(`${base}${playlistPath}`);
  assert.equal(playlist.status, 200);
  assert.match(playlist.headers.get('content-type'), /mpegurl/);

  const text = await playlist.text();
  const segments = text.split('\n').filter((line) => line && !line.startsWith('#'));
  assert.ok(segments.length >= 2, 'kayi segments hone chahiye');
  assert.ok(segments.every((line) => /^seg_\d+\.ts\?t=.+/.test(line)), 'har segment par token laga ho');
  assert.match(text, /#EXT-X-ENDLIST/);

  const first = await fetch(`${base}/hls/2/${segments[0]}`);
  assert.equal(first.status, 200);
  assert.equal(first.headers.get('content-type'), 'video/mp2t');
  const full = Buffer.from(await first.arrayBuffer());
  assert.ok(full.length > 1000);

  const ranged = await fetch(`${base}/hls/2/${segments[0]}`, { headers: { Range: 'bytes=0-99' } });
  assert.equal(ranged.status, 206);
  assert.equal((await ranged.arrayBuffer()).byteLength, 100);

  // token ke bina / ghalat lecture ke token se / ghalat file naam
  assert.equal((await fetch(`${base}/hls/2/index.m3u8`)).status, 401);
  assert.equal((await fetch(`${base}/hls/2/seg_00000.ts`)).status, 401);
  const otherToken = signPlaybackToken({ lectureId: 9, userId: 'x' }, SECRET, 60);
  assert.equal((await fetch(`${base}/hls/2/index.m3u8?t=${otherToken}`)).status, 401);
  const token = signPlaybackToken({ lectureId: 2, userId: 'x' }, SECRET, 60);
  assert.equal((await fetch(`${base}/hls/2/..%2F..%2Fpackage.json?t=${token}`)).status, 404);
  assert.equal((await fetch(`${base}/hls/2/secret.txt?t=${token}`)).status, 404);
});

test('transcode: purani codec wali mkv browser-safe HLS ban jati hai', async () => {
  lectures.set(4, { id: 4, batch_id: 1, status: 'Published', processing_status: 'Pending' });

  const res = await upload(4, path.join(tmp, 'old.mkv'), { chunkSize: 64 * 1024 });
  assert.equal(res.status, 202);

  await processor.idle();
  assert.equal(lectures.get(4).processing_status, 'Ready', lectures.get(4).processing_error);

  const seg = fs.readdirSync(storage.hlsDir(4)).find((name) => name.endsWith('.ts'));
  const codecs = execFileSync('ffprobe', [
    '-v', 'error', '-show_entries', 'stream=codec_name,pix_fmt', '-of', 'csv=p=0',
    path.join(storage.hlsDir(4), seg),
  ]).toString();
  assert.match(codecs, /h264,yuv420p/);
  assert.match(codecs, /aac/);
});

test('kharab file: Failed, saaf error, file saaf', async () => {
  lectures.set(5, { id: 5, batch_id: 1, status: 'Published', processing_status: 'Pending' });

  const res = await upload(5, path.join(tmp, 'fake.mp4'), { chunkSize: 1024 });
  assert.equal(res.status, 202);

  await processor.idle();
  assert.equal(lectures.get(5).processing_status, 'Failed');
  assert.match(lectures.get(5).processing_error, /video/i);
  assert.equal(await exists(storage.sourcePath(5)), false);
  assert.equal(await exists(storage.hlsNewDir(5)), false);
});

test('video badalna: purani chalti rahe, nayi kamyab ho to badal jaye', async () => {
  // lecture 2 Ready hai. Nayi upload shuru karo: status Ready hi rehna chahiye
  const bytes = await fsp.readFile(path.join(tmp, 'old.mkv'));
  const res = await fetch(`${base}/api/lectures/2/upload?offset=0&total=${bytes.length}&filename=old.mkv`, {
    method: 'POST',
    headers: { ...auth('admin-token'), 'Content-Type': 'application/octet-stream' },
    body: bytes.subarray(0, 500),
  });
  assert.equal(res.status, 200);
  assert.equal(lectures.get(2).processing_status, 'Ready');
  assert.equal(
    (await fetch(`${base}/api/lectures/2/playback`, { method: 'POST', headers: auth('member-token') })).status,
    200,
  );
});

test('delete: saari files mit jati hain', async () => {
  assert.equal(await exists(storage.hlsDir(2)), true);

  const res = await fetch(`${base}/api/lectures/2/video`, { method: 'DELETE', headers: auth('admin-token') });
  assert.equal(res.status, 204);

  assert.equal(await exists(storage.hlsDir(2)), false);
  assert.equal(await exists(storage.partPath(2)), false);
  assert.equal(await exists(storage.metaPath(2)), false);

  const student = await fetch(`${base}/api/lectures/4/video`, { method: 'DELETE', headers: auth('member-token') });
  assert.equal(student.status, 403, 'student delete nahi kar sakta');
  assert.equal(await exists(storage.hlsDir(4)), true);
});

test('CORS: sirf Angular ka address', async () => {
  const ok = await fetch(`${base}/health`, { headers: { Origin: 'http://localhost:4200' } });
  assert.equal(ok.headers.get('access-control-allow-origin'), 'http://localhost:4200');

  const other = await fetch(`${base}/health`, { headers: { Origin: 'http://evil.example' } });
  assert.equal(other.headers.get('access-control-allow-origin'), null);
});
