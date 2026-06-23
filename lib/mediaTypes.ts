const VIDEO_EXT = /\.(mp4|webm|mov|m4v|m4p)$/i;
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i;

/** Runway and other tools often export without a file extension. */
const RUNWAY_NAME = /gen-?4|runway|cinematic|create a cine/i;

export type SniffedMedia = 'video' | 'image' | 'unknown';

export function isVideoFileName(name: string): boolean {
  return VIDEO_EXT.test(name) || RUNWAY_NAME.test(name);
}

export function isImageFileName(name: string): boolean {
  return IMAGE_EXT.test(name);
}

export async function sniffMediaType(file: File): Promise<SniffedMedia> {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';
  if (isVideoFileName(file.name)) return 'video';
  if (isImageFileName(file.name)) return 'image';

  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());

  if (head.length >= 8) {
    const box = String.fromCharCode(head[4], head[5], head[6], head[7]);
    if (box === 'ftyp') return 'video';
  }

  // WebM / Matroska
  if (head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) {
    return 'video';
  }

  // JPEG
  if (head[0] === 0xff && head[1] === 0xd8) return 'image';

  // PNG
  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) {
    return 'image';
  }

  return 'unknown';
}

export async function resolveUploadMediaType(
  file: File,
  intent?: 'image' | 'video',
): Promise<'video' | 'image' | null> {
  const sniffed = await sniffMediaType(file);
  if (sniffed === 'video' || sniffed === 'image') return sniffed;

  if (intent === 'video' && file.size > 50_000) return 'video';
  if (intent === 'image') return 'image';

  return null;
}

export function videoFileNameForUpload(file: File): string {
  if (VIDEO_EXT.test(file.name)) return file.name;
  const base = file.name.replace(/\.[^.]+$/, '') || 'hero-video';
  return `${base}.mp4`;
}
