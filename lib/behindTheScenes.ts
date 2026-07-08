import { loadPlatformSettings, savePlatformSettings, type PlatformSettings } from "./platformSettings";

export interface BehindTheScenesMedia {
  photos: string[];
  videos: string[];
}

const EMPTY: BehindTheScenesMedia = { photos: [], videos: [] };

type SettingsWithBts = PlatformSettings & { behindTheScenes?: BehindTheScenesMedia };

export async function getBehindTheScenesMedia(): Promise<BehindTheScenesMedia> {
  const settings = (await loadPlatformSettings()) as SettingsWithBts;
  const bts = settings.behindTheScenes;
  if (!bts) return { ...EMPTY };
  return {
    photos: Array.isArray(bts.photos) ? bts.photos.filter((u) => typeof u === "string" && u) : [],
    videos: Array.isArray(bts.videos) ? bts.videos.filter((u) => typeof u === "string" && u) : [],
  };
}

export async function saveBehindTheScenesMedia(media: BehindTheScenesMedia): Promise<void> {
  const settings = (await loadPlatformSettings()) as SettingsWithBts;
  const next: SettingsWithBts = {
    ...settings,
    behindTheScenes: {
      photos: media.photos.slice(0, 24),
      videos: media.videos.slice(0, 8),
    },
  };
  await savePlatformSettings(next as PlatformSettings);
}

/** Merge admin-curated media first, then any journey-captured photos. Dedupes URLs. */
export function mergeBehindTheScenes(
  curated: BehindTheScenesMedia,
  journeyPhotos: string[],
  journeyVideos: string[] = [],
): BehindTheScenesMedia {
  const photos: string[] = [];
  const videos: string[] = [];
  const push = (list: string[], u?: string | null) => {
    if (u && typeof u === "string" && !list.includes(u)) list.push(u);
  };
  curated.photos.forEach((u) => push(photos, u));
  journeyPhotos.forEach((u) => push(photos, u));
  curated.videos.forEach((u) => push(videos, u));
  journeyVideos.forEach((u) => push(videos, u));
  return { photos, videos };
}

export async function uploadBehindTheScenesFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload/media", { method: "POST", body: form });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  const url = data.url || data.ipfsUrl || data.gatewayUrl;
  if (!url) throw new Error("No URL returned from upload");
  return url as string;
}
