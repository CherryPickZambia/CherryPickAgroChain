"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Image as ImageIcon, Video } from "lucide-react";
import toast from "react-hot-toast";
import {
  getBehindTheScenesMedia,
  saveBehindTheScenesMedia,
  uploadBehindTheScenesFile,
  type BehindTheScenesMedia,
} from "@/lib/behindTheScenes";

const DEEP = "#0C2D3A";
const MUTE = "#5A7684";
const LIME = "#BFFF00";

export default function AdminBehindTheScenes() {
  const [media, setMedia] = useState<BehindTheScenesMedia>({ photos: [], videos: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [urlKind, setUrlKind] = useState<"photo" | "video">("photo");

  useEffect(() => {
    getBehindTheScenesMedia()
      .then(setMedia)
      .finally(() => setLoading(false));
  }, []);

  const persist = async (next: BehindTheScenesMedia) => {
    setSaving(true);
    try {
      await saveBehindTheScenesMedia(next);
      setMedia(next);
      toast.success("Behind the Scenes updated");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const onUpload = async (files: FileList | null, kind: "photo" | "video") => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        urls.push(await uploadBehindTheScenesFile(file));
      }
      const next =
        kind === "photo"
          ? { ...media, photos: [...media.photos, ...urls] }
          : { ...media, videos: [...media.videos, ...urls] };
      await persist(next);
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const addUrl = async () => {
    const url = urlDraft.trim();
    if (!url) return;
    const next =
      urlKind === "photo"
        ? { ...media, photos: [...media.photos, url] }
        : { ...media, videos: [...media.videos, url] };
    setUrlDraft("");
    await persist(next);
  };

  const remove = async (kind: "photo" | "video", index: number) => {
    const next =
      kind === "photo"
        ? { ...media, photos: media.photos.filter((_, i) => i !== index) }
        : { ...media, videos: media.videos.filter((_, i) => i !== index) };
    await persist(next);
  };

  if (loading) {
    return (
      <div style={{ padding: 40, display: "flex", alignItems: "center", gap: 10, color: MUTE }}>
        <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} /> Loading gallery...
      </div>
    );
  }

  return (
    <div style={{ background: "#F7F9FB", borderRadius: 24, overflow: "hidden" }}>
      <div style={{ padding: "48px 40px 0" }}>
        <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: MUTE, borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 16 }}>
          Consumer Content
        </div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(2rem,5vw,3.5rem)", lineHeight: 0.9, letterSpacing: "-0.04em", color: DEEP, marginBottom: 16 }}>
          BEHIND THE<br />SCENES
        </h1>
        <p style={{ fontFamily: "'Manrope',sans-serif", color: MUTE, maxWidth: 560, marginBottom: 40 }}>
          Choose the photos and videos shown on the public lookup and QR trace pages. Curated media appears first; journey captures from batches still fill any remaining slots.
        </p>
      </div>

      <div style={{ padding: "0 40px 48px", display: "grid", gap: 24 }}>
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid rgba(12,45,58,0.06)", padding: 24 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 20 }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, background: DEEP, color: LIME, padding: "10px 16px", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
              <ImageIcon style={{ width: 16, height: 16 }} />
              {uploading ? "Uploading..." : "Upload photos"}
              <input type="file" accept="image/*" multiple hidden disabled={uploading || saving} onChange={(e) => onUpload(e.target.files, "photo")} />
            </label>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#E6E2D6", color: DEEP, padding: "10px 16px", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
              <Video style={{ width: 16, height: 16 }} />
              Upload videos
              <input type="file" accept="video/*" multiple hidden disabled={uploading || saving} onChange={(e) => onUpload(e.target.files, "video")} />
            </label>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            <select
              value={urlKind}
              onChange={(e) => setUrlKind(e.target.value as "photo" | "video")}
              style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(12,45,58,0.12)", fontFamily: "'Manrope',sans-serif" }}
            >
              <option value="photo">Photo URL</option>
              <option value="video">Video URL</option>
            </select>
            <input
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="https://..."
              style={{ flex: 1, minWidth: 180, padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(12,45,58,0.12)", fontFamily: "'Manrope',sans-serif" }}
            />
            <button
              type="button"
              onClick={addUrl}
              disabled={!urlDraft.trim() || saving}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, background: LIME, color: DEEP, border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 800, cursor: "pointer" }}
            >
              <Plus style={{ width: 16, height: 16 }} /> Add
            </button>
          </div>

          <h3 style={{ fontFamily: "'Syne',sans-serif", color: DEEP, margin: "0 0 12px" }}>Photos ({media.photos.length})</h3>
          {media.photos.length === 0 ? (
            <p style={{ color: MUTE, fontFamily: "'Manrope',sans-serif", fontSize: 14 }}>No curated photos yet. Journey photos from batches still show publicly when present.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12, marginBottom: 28 }}>
              {media.photos.map((url, i) => (
                <div key={url + i} style={{ position: "relative", borderRadius: 12, overflow: "hidden", aspectRatio: "1", border: "1px solid rgba(12,45,58,0.08)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button
                    type="button"
                    onClick={() => remove("photo", i)}
                    style={{ position: "absolute", top: 6, right: 6, width: 28, height: 28, borderRadius: 8, border: "none", background: "rgba(0,0,0,0.65)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Trash2 style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <h3 style={{ fontFamily: "'Syne',sans-serif", color: DEEP, margin: "0 0 12px" }}>Videos ({media.videos.length})</h3>
          {media.videos.length === 0 ? (
            <p style={{ color: MUTE, fontFamily: "'Manrope',sans-serif", fontSize: 14 }}>No curated videos yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {media.videos.map((url, i) => (
                <div key={url + i} style={{ display: "flex", gap: 12, alignItems: "center", background: "#F7F9FB", borderRadius: 12, padding: 12 }}>
                  <video src={url} style={{ width: 120, height: 72, objectFit: "cover", borderRadius: 8, background: "#000" }} />
                  <div style={{ flex: 1, fontSize: 12, color: MUTE, wordBreak: "break-all" }}>{url}</div>
                  <button type="button" onClick={() => remove("video", i)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#b91c1c" }}>
                    <Trash2 style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
