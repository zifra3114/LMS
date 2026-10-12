import { spawn } from 'node:child_process';
import path from 'node:path';
import fsp from 'node:fs/promises';
import { exists, removePath } from './storage.js';

const SEGMENT_SECONDS = 6;

/** Ek command chalata hai. onLine diya ho to stdout line-by-line us tak jata hai. */
function run(command, args, { onLine, onSpawn } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    onSpawn?.(child);

    let stdout = '';
    let stderr = '';
    let pending = '';

    child.stdout.on('data', (data) => {
      if (!onLine) {
        stdout += data;
        return;
      }

      pending += data.toString();
      let newline;
      while ((newline = pending.indexOf('\n')) >= 0) {
        onLine(pending.slice(0, newline).trim());
        pending = pending.slice(newline + 1);
      }
    });

    child.stderr.on('data', (data) => {
      stderr = (stderr + data).slice(-4000);
    });

    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

/** FFmpeg aur FFprobe install hain ya nahi, server shuru hone par hi pata chal jaye. */
export async function checkBinaries({ ffmpegPath, ffprobePath }) {
  for (const command of [ffmpegPath, ffprobePath]) {
    try {
      const result = await run(command, ['-version']);
      if (result.code !== 0) throw new Error('bad exit');
    } catch {
      throw new Error(
        `"${command}" nahi mila. FFmpeg install karein (README dekhein) ya .env mein FFMPEG_PATH / FFPROBE_PATH ka poora path likhein.`,
      );
    }
  }
}

export async function probeFile(ffprobePath, file) {
  const result = await run(ffprobePath, [
    '-v', 'error',
    '-print_format', 'json',
    '-show_streams',
    '-show_format',
    file,
  ]);

  if (result.code !== 0) {
    throw new Error('Ye file video ki tarah parhi nahi ja saki. Dusri file try karein.');
  }

  const info = JSON.parse(result.stdout);
  const streams = info.streams ?? [];

  return {
    video: streams.find((s) => s.codec_type === 'video' && !s.disposition?.attached_pic),
    audio: streams.find((s) => s.codec_type === 'audio'),
    duration: Number(info.format?.duration) || 0,
  };
}

/**
 * Jo cheez browser ke liye pehle se theek hai use dobara encode nahi karte (bohat tez).
 * Sirf H.264 (yuv420p) video aur AAC audio browser mein seedha chalte hain.
 */
export function planTranscode({ video, audio }) {
  return {
    copyVideo: video?.codec_name === 'h264' && video?.pix_fmt === 'yuv420p',
    copyAudio: !audio || audio.codec_name === 'aac',
  };
}

export function buildFfmpegArgs({ input, outDir, audio, plan }) {
  const args = ['-hide_banner', '-nostdin', '-nostats', '-loglevel', 'error', '-y', '-i', input];

  args.push('-map', '0:v:0');
  if (audio) args.push('-map', '0:a:0');

  if (plan.copyVideo) {
    args.push('-c:v', 'copy');
  } else {
    args.push(
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-vf', "scale=-2:'min(1080,ih)'",
      '-force_key_frames', `expr:gte(t,n_forced*${SEGMENT_SECONDS})`,
    );
  }

  if (audio) {
    if (plan.copyAudio) args.push('-c:a', 'copy');
    else args.push('-c:a', 'aac', '-b:a', '128k', '-ac', '2');
  }

  args.push(
    '-f', 'hls',
    '-hls_time', String(SEGMENT_SECONDS),
    '-hls_playlist_type', 'vod',
    '-hls_list_size', '0',
    '-hls_segment_type', 'mpegts',
    '-hls_segment_filename', path.join(outDir, 'seg_%05d.ts'),
    '-progress', 'pipe:1',
    path.join(outDir, 'index.m3u8'),
  );

  return args;
}

const tail = (text) =>
  String(text || '')
    .trim()
    .split('\n')
    .slice(-3)
    .join(' ')
    .slice(0, 500) || 'FFmpeg ne video convert nahi ki.';

/**
 * Convert karne ki line (queue). Ek waqt mein sirf ek video convert hoti hai taake
 * server ka CPU / RAM na bhar jaye.
 */
export function createProcessor({ config, storage, db, log = console }) {
  const queue = [];
  const idleWaiters = [];
  let current = null;

  function enqueue(id) {
    if (queue.includes(id) || current?.id === id) return;
    queue.push(id);
    void pump();
  }

  /** Lecture delete / video badalne par: queue se hatao, chal rahi ho to rok do. */
  function cancel(id) {
    const index = queue.indexOf(id);
    if (index >= 0) queue.splice(index, 1);

    if (current?.id === id) {
      current.cancelled = true;
      current.child?.kill('SIGKILL');
    }
  }

  /** Jab queue khali ho aur kuch na chal raha ho. Tests ke liye. */
  function idle() {
    if (!current && queue.length === 0) return Promise.resolve();
    return new Promise((resolve) => idleWaiters.push(resolve));
  }

  async function pump() {
    if (current) return;

    const id = queue.shift();
    if (id === undefined) {
      idleWaiters.splice(0).forEach((resolve) => resolve());
      return;
    }

    current = { id, child: null, cancelled: false };

    try {
      await processLecture(current);
    } catch (error) {
      log.error(`[lecture ${id}] processing error:`, error);
    } finally {
      current = null;
      void pump();
    }
  }

  async function processLecture(job) {
    const { id } = job;
    const source = storage.sourcePath(id);
    const workDir = storage.hlsNewDir(id);

    try {
      if (!(await exists(source))) throw new Error('Upload ki hui file server par nahi mili.');

      await db.updateLecture(id, {
        processing_status: 'Processing',
        processing_progress: 0,
        processing_error: null,
      });

      const info = await probeFile(config.ffprobePath, source);
      if (!info.video) throw new Error('Is file mein video track nahi hai.');

      await removePath(workDir);
      await fsp.mkdir(workDir, { recursive: true });

      const plan = planTranscode(info);
      const args = buildFfmpegArgs({ input: source, outDir: workDir, audio: info.audio, plan });
      log.log(
        `[lecture ${id}] convert shuru (${plan.copyVideo ? 'video copy' : 'video encode'}, ` +
          `${plan.copyAudio ? 'audio copy' : 'audio encode'})`,
      );

      let lastPercent = -1;
      let lastWrite = 0;

      const result = await run(config.ffmpegPath, args, {
        onSpawn: (child) => {
          job.child = child;
        },
        onLine: (line) => {
          const match = line.match(/^out_time_(?:us|ms)=(\d+)/);
          if (!match || !info.duration) return;

          // ffmpeg dono naamon se microseconds hi deta hai
          const percent = Math.min(99, Math.floor((Number(match[1]) / 1e6 / info.duration) * 100));
          const now = Date.now();

          if (percent >= lastPercent + 5 && now - lastWrite > 2000) {
            lastPercent = percent;
            lastWrite = now;
            db.updateLecture(id, { processing_progress: percent }).catch(() => {});
          }
        },
      });

      if (job.cancelled) {
        await removePath(workDir);
        return;
      }

      if (result.code !== 0) throw new Error(tail(result.stderr));
      if (!(await exists(path.join(workDir, 'index.m3u8')))) {
        throw new Error('FFmpeg ne playlist nahi banayi.');
      }

      // Nayi HLS tayyar hai: purani (agar thi) hata kar badal do
      await removePath(storage.hlsDir(id));
      await fsp.rename(workDir, storage.hlsDir(id));
      await removePath(source);

      await db.updateLecture(id, {
        processing_status: 'Ready',
        processing_progress: 100,
        processing_error: null,
        playlist_path: `${id}/index.m3u8`,
        duration_minutes: info.duration ? Math.max(1, Math.round(info.duration / 60)) : 0,
      });

      log.log(`[lecture ${id}] tayyar`);
    } catch (error) {
      await removePath(workDir);

      if (job.cancelled) return;

      log.error(`[lecture ${id}] fail:`, error.message);
      await removePath(source);
      await db
        .updateLecture(id, {
          processing_status: 'Failed',
          processing_error: String(error.message).slice(0, 500),
        })
        .catch(() => {});
    }
  }

  return { enqueue, cancel, idle };
}
