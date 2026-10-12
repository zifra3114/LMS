import fsp from 'node:fs/promises';
import path from 'node:path';

/**
 * Disk par jagahon ka naqsha:
 *   storage/uploads/<id>.part   upload ho rahi file
 *   storage/uploads/<id>.json   us file ka naam aur total size (resume ke liye)
 *   storage/uploads/<id>.src    mukammal upload, FFmpeg ka intezar
 *   storage/hls/<id>/           tayyar HLS (index.m3u8 + seg_00001.ts ...)
 *   storage/hls/<id>.new/       FFmpeg abhi yahan likh raha hai
 *
 * <id> hamesha lecture ka number hota hai, isliye user ka diya hua naam path mein nahi jata.
 */
export function createStorage(baseDir) {
  const uploads = path.join(baseDir, 'uploads');
  const hls = path.join(baseDir, 'hls');

  return {
    baseDir,
    async ensure() {
      await fsp.mkdir(uploads, { recursive: true });
      await fsp.mkdir(hls, { recursive: true });
    },
    partPath: (id) => path.join(uploads, `${id}.part`),
    metaPath: (id) => path.join(uploads, `${id}.json`),
    sourcePath: (id) => path.join(uploads, `${id}.src`),
    hlsDir: (id) => path.join(hls, String(id)),
    hlsNewDir: (id) => path.join(hls, `${id}.new`),
  };
}

export async function fileSize(file) {
  try {
    return (await fsp.stat(file)).size;
  } catch {
    return 0;
  }
}

export async function exists(file) {
  try {
    await fsp.access(file);
    return true;
  } catch {
    return false;
  }
}

export async function removePath(target) {
  await fsp.rm(target, { recursive: true, force: true });
}

export async function readJson(file) {
  try {
    return JSON.parse(await fsp.readFile(file, 'utf8'));
  } catch {
    return null;
  }
}
