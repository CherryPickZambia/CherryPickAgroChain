"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Save, Loader2, Upload, Plus, Trash2, Image as ImageIcon, Video,
  ChevronDown, ChevronUp, ExternalLink, RotateCcw, Star,
} from "lucide-react";
import toast from "react-hot-toast";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import { dc, D, syne, manrope } from "@/lib/dashboardTheme";
import { uploadImageToIPFS } from "@/lib/ipfsService";
import { resolveUploadMediaType } from "@/lib/mediaTypes";
import {
  DEFAULT_LANDING_PAGE_CONTENT,
  loadLandingPageContent,
  saveLandingPageContent,
  newId,
  type HeroMediaType,
  type LandingPageContent,
  type LandingTestimonial,
  type LandingCard,
  type LandingMetric,
} from "@/lib/landingPageContent";

type Aspect = "hero" | "feature" | "cta";

const ASPECT_CLASS: Record<Aspect, string> = {
  hero: "aspect-[16/9]",
  feature: "aspect-[4/5]",
  cta: "aspect-[21/9]",
};

function Field({
  label,
  value,
  onChange,
  multiline,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const cls = dc.input + " mt-1.5";
  return (
    <label className="block">
      <span className={dc.labelSm}>{label}</span>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls + " resize-y min-h-[72px]"}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </label>
  );
}

function ImageField({
  label,
  value,
  onChange,
  aspect,
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspect: Aspect;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const maxWidth = aspect === "hero" ? 2400 : aspect === "cta" ? 2000 : 1200;
      const result = await uploadImageToIPFS(file, maxWidth);
      onChange(result.url);
      toast.success("Image uploaded");
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <span className={dc.labelSm}>{label}</span>
      {hint && <p className="text-xs text-[#94B3C1] mt-0.5">{hint}</p>}
      <div className={`mt-2 relative overflow-hidden rounded-xl border border-[#0C2D3A]/10 bg-[#0C2D3A]/5 ${ASPECT_CLASS[aspect]}`}>
        {value ? (
          <img src={value} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#94B3C1] gap-2">
            <ImageIcon className="h-8 w-8 opacity-40" />
            <span className="text-xs">No image</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={dc.btnPrimary + " inline-flex items-center gap-2 disabled:opacity-60"}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload
        </button>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste image URL"
          className={dc.input + " flex-1 min-w-[200px]"}
        />
      </div>
    </div>
  );
}

function HeroMediaField({
  hero,
  onChange,
}: {
  hero: LandingPageContent["hero"];
  onChange: (hero: LandingPageContent["hero"]) => void;
}) {
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const setMediaType = (mediaType: HeroMediaType) => onChange({ ...hero, mediaType });

  const uploadMediaFile = async (file: File, intent: HeroMediaType) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("intent", intent);
      const response = await fetch("/api/upload/media", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      if (data.mediaType === "video") {
        onChange({ ...hero, mediaType: "video", videoUrl: data.url });
        toast.success("Hero video uploaded - click Save changes");
      } else {
        onChange({ ...hero, mediaType: "image", imageUrl: data.url });
        toast.success("Hero image uploaded - click Save changes");
      }
    } catch (error) {
      const sniffed = await resolveUploadMediaType(file, intent);
      if (sniffed === "image") {
        try {
          const result = await uploadImageToIPFS(file, 2400);
          onChange({ ...hero, mediaType: "image", imageUrl: result.url });
          toast.success("Hero image uploaded");
          return;
        } catch {
          /* fall through */
        }
      }
      toast.error(error instanceof Error ? error.message : "Upload failed - try pasting a direct MP4 URL");
    } finally {
      setUploading(false);
    }
  };

  const processPickedFile = async (file: File) => {
    const sniffed = await resolveUploadMediaType(file, hero.mediaType);

    if (sniffed === "video") {
      await uploadMediaFile(file, "video");
      return;
    }

    if (sniffed === "image") {
      if (hero.mediaType === "video") {
        toast.error("That is an image. Use “Choose hero video file” for MP4/MOV - poster upload is for JPG/PNG only.");
        return;
      }
      await uploadMediaFile(file, "image");
      return;
    }

    if (hero.mediaType === "video") {
      await uploadMediaFile(file, "video");
      return;
    }

    toast.error("Could not recognize this file. For video, select the Video tab first.");
  };

  const onPreviewDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void processPickedFile(file);
  };

  return (
    <div className="space-y-3">
      <span className={dc.labelSm}>Hero background</span>
      <p className="text-xs text-[#94B3C1]">
        For MP4 hero video: select <strong className="text-[#0C2D3A]">Video</strong>, then use{" "}
        <strong className="text-[#0C2D3A]">Choose hero video file</strong> (not poster upload).
      </p>

      <div className="flex gap-2">
        {(["image", "video"] as HeroMediaType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setMediaType(type)}
            className={
              "px-4 py-2 rounded-xl text-sm font-semibold transition-all " +
              (hero.mediaType === type
                ? "bg-[#0C2D3A] text-[#BFFF00]"
                : "bg-[#0C2D3A]/5 text-[#0C2D3A] border border-[#0C2D3A]/10")
            }
          >
            {type === "image" ? "Image" : "Video"}
          </button>
        ))}
      </div>

      <div
        className={`relative overflow-hidden rounded-xl border bg-[#0C2D3A]/5 ${ASPECT_CLASS.hero} ${
          dragOver ? "border-[#BFFF00] border-2" : "border-[#0C2D3A]/10"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onPreviewDrop}
      >
        {hero.mediaType === "video" && hero.videoUrl ? (
          <video
            src={hero.videoUrl}
            poster={hero.imageUrl || undefined}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            loop
            playsInline
            autoPlay
            controls
          />
        ) : hero.imageUrl ? (
          <img src={hero.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#94B3C1] gap-2 px-4 text-center">
            {hero.mediaType === "video" ? (
              <Video className="h-8 w-8 opacity-40" />
            ) : (
              <ImageIcon className="h-8 w-8 opacity-40" />
            )}
            <span className="text-xs">
              {dragOver ? "Drop file here" : `No ${hero.mediaType} yet - or drag & drop`}
            </span>
          </div>
        )}
      </div>

      {hero.mediaType === "video" ? (
        <div className="space-y-3">
          {/* Dedicated video picker - NO accept filter (macOS blocks MP4 with image/*) */}
          <input
            ref={videoInputRef}
            id="hero-video-file-input"
            type="file"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void processPickedFile(f);
              e.target.value = "";
            }}
          />
          <label
            htmlFor="hero-video-file-input"
            className={
              dc.btnPrimary +
              " inline-flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto " +
              (uploading ? "opacity-60 pointer-events-none" : "")
            }
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
            Choose hero video file (MP4, MOV…)
          </label>
          <p className="text-xs text-[#94B3C1]">Opens all files - select your .mp4 or Runway export. Or drag onto preview above.</p>

          <input
            type="text"
            value={hero.videoUrl}
            onChange={(e) => onChange({ ...hero, mediaType: "video", videoUrl: e.target.value })}
            placeholder="Or paste direct video URL (MP4 link)"
            className={dc.input + " w-full"}
          />

          <div className="rounded-xl border border-[#0C2D3A]/10 bg-[#F7F9FB] p-3">
            <span className={dc.labelSm}>Poster still (optional, images only)</span>
            <p className="text-xs text-[#94B3C1] mt-0.5 mb-2">JPG/PNG shown while video loads - not for MP4</p>
            <input
              ref={posterInputRef}
              id="hero-poster-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,.jpg,.jpeg,.png,.webp"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setUploadingPoster(true);
                try {
                  const form = new FormData();
                  form.append("file", f);
                  form.append("intent", "image");
                  const response = await fetch("/api/upload/media", { method: "POST", body: form });
                  const data = await response.json();
                  if (!response.ok) throw new Error(data.error);
                  onChange({ ...hero, imageUrl: data.url });
                  toast.success("Poster image uploaded");
                } catch {
                  try {
                    const result = await uploadImageToIPFS(f, 2400);
                    onChange({ ...hero, imageUrl: result.url });
                    toast.success("Poster image uploaded");
                  } catch {
                    toast.error("Poster upload failed");
                  }
                } finally {
                  setUploadingPoster(false);
                  e.target.value = "";
                }
              }}
            />
            <div className="flex flex-wrap gap-2">
              <label
                htmlFor="hero-poster-file-input"
                className={
                  dc.btnSecondary +
                  " inline-flex items-center gap-2 cursor-pointer " +
                  (uploadingPoster ? "opacity-60 pointer-events-none" : "")
                }
              >
                {uploadingPoster ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Choose poster image
              </label>
              <input
                type="text"
                value={hero.imageUrl}
                onChange={(e) => onChange({ ...hero, imageUrl: e.target.value })}
                placeholder="Or paste poster URL"
                className={dc.input + " flex-1 min-w-[200px]"}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            ref={imageInputRef}
            id="hero-image-file-input"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,.jpg,.jpeg,.png,.webp"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void processPickedFile(f);
              e.target.value = "";
            }}
          />
          <label
            htmlFor="hero-image-file-input"
            className={
              dc.btnPrimary +
              " inline-flex items-center gap-2 cursor-pointer " +
              (uploading ? "opacity-60 pointer-events-none" : "")
            }
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Choose hero image
          </label>
          <input
            type="text"
            value={hero.imageUrl}
            onChange={(e) => onChange({ ...hero, imageUrl: e.target.value })}
            placeholder="Or paste image URL"
            className={dc.input + " w-full"}
          />
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  index,
  children,
  defaultOpen = false,
}: {
  title: string;
  index: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={dc.panel + " overflow-hidden mb-4"}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#0C2D3A]/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={dc.badge}>{String(index).padStart(2, "0")}</span>
          <span style={syne} className="text-lg font-bold text-[#0C2D3A]">{title}</span>
        </div>
        {open ? <ChevronUp className="h-5 w-5 text-[#5A7684]" /> : <ChevronDown className="h-5 w-5 text-[#5A7684]" />}
      </button>
      {open && <div className="px-6 pb-6 pt-0 border-t border-[#0C2D3A]/6">{children}</div>}
    </div>
  );
}

function BulletEditor({ bullets, onChange }: { bullets: string[]; onChange: (b: string[]) => void }) {
  return (
    <div className="space-y-2">
      <span className={dc.labelSm}>Bullet points</span>
      {bullets.map((b, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={b}
            onChange={(e) => {
              const next = [...bullets];
              next[i] = e.target.value;
              onChange(next);
            }}
            className={dc.input}
          />
          <button
            type="button"
            onClick={() => onChange(bullets.filter((_, j) => j !== i))}
            className="p-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...bullets, ""])}
        className={dc.btnSecondary + " inline-flex items-center gap-2 mt-1"}
      >
        <Plus className="h-4 w-4" /> Add bullet
      </button>
    </div>
  );
}

export default function LandingPageEditor() {
  const { evmAddress } = useEvmAddress();
  const [content, setContent] = useState<LandingPageContent>(DEFAULT_LANDING_PAGE_CONTENT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    loadLandingPageContent()
      .then(setContent)
      .finally(() => setLoading(false));
  }, []);

  const patch = useCallback(<K extends keyof LandingPageContent>(
    key: K,
    value: LandingPageContent[K]
  ) => {
    setContent((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const result = await saveLandingPageContent(content, evmAddress ?? undefined);
    setSaving(false);
    if (result.error) {
      toast.success("Saved locally - cloud sync had an issue");
    } else {
      toast.success("Landing page saved");
    }
    setDirty(false);
  };

  const handleReset = () => {
    if (!confirm("Reset all fields to factory defaults? Unsaved changes will be lost.")) return;
    setContent(DEFAULT_LANDING_PAGE_CONTENT);
    setDirty(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#0C2D3A]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className={dc.infoBox + " flex-1 min-w-[240px]"}>
          <p style={manrope} className="text-sm text-[#0C2D3A]">
            Edit hero images, section copy, metrics, and farmer reviews. Images are cropped to fit each slot with{" "}
            <code className="text-xs bg-white/60 px-1 rounded">object-fit: cover</code>. Changes persist after you save.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={dc.btnSecondary + " inline-flex items-center gap-2"}
          >
            <ExternalLink className="h-4 w-4" /> Preview site
          </a>
          <button type="button" onClick={handleReset} className={dc.btnSecondary + " inline-flex items-center gap-2"}>
            <RotateCcw className="h-4 w-4" /> Reset defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className={dc.btnPrimary + " inline-flex items-center gap-2 disabled:opacity-50"}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {dirty ? "Save changes" : "Saved"}
          </button>
        </div>
      </div>

      <Section title="Hero" index={1} defaultOpen>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
          <HeroMediaField
            hero={content.hero}
            onChange={(hero) => patch("hero", hero)}
          />
          <div className="space-y-3">
            <Field label="Tagline" value={content.hero.tagline} onChange={(v) => patch("hero", { ...content.hero, tagline: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Title" value={content.hero.title} onChange={(v) => patch("hero", { ...content.hero, title: v })} />
              <Field label="Accent" value={content.hero.titleAccent} onChange={(v) => patch("hero", { ...content.hero, titleAccent: v })} />
            </div>
            <Field label="Meta line" value={content.hero.meta} onChange={(v) => patch("hero", { ...content.hero, meta: v })} />
            <Field label="Description" value={content.hero.description} onChange={(v) => patch("hero", { ...content.hero, description: v })} />
            <Field label="Alt text / accessibility" value={content.hero.imageAlt} onChange={(v) => patch("hero", { ...content.hero, imageAlt: v })} />
          </div>
        </div>
      </Section>

      <Section title="Navigation" index={2}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <Field
            label="Nav links (comma-separated)"
            value={content.nav.links.join(", ")}
            onChange={(v) => patch("nav", { ...content.nav, links: v.split(",").map((s) => s.trim()).filter(Boolean) })}
          />
          <Field label="Join button text" value={content.nav.ctaText} onChange={(v) => patch("nav", { ...content.nav, ctaText: v })} />
        </div>
      </Section>

      <Section title="The Idea" index={3}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <Field label="Section label" value={content.theIdea.sectionLabel} onChange={(v) => patch("theIdea", { ...content.theIdea, sectionLabel: v })} />
          <Field label="Closing tagline" value={content.theIdea.tagline} onChange={(v) => patch("theIdea", { ...content.theIdea, tagline: v })} />
          <Field label="Heading" value={content.theIdea.heading} onChange={(v) => patch("theIdea", { ...content.theIdea, heading: v })} />
          <Field label="Heading emphasis (italic)" value={content.theIdea.headingEmphasis} onChange={(v) => patch("theIdea", { ...content.theIdea, headingEmphasis: v })} />
          <Field label="Paragraph 1" value={content.theIdea.paragraph1} onChange={(v) => patch("theIdea", { ...content.theIdea, paragraph1: v })} multiline />
          <Field label="Paragraph 2" value={content.theIdea.paragraph2} onChange={(v) => patch("theIdea", { ...content.theIdea, paragraph2: v })} multiline />
        </div>
      </Section>

      <Section title="For Farmers" index={4}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
          <ImageField
            label="Feature image"
            value={content.farmers.imageUrl}
            onChange={(v) => patch("farmers", { ...content.farmers, imageUrl: v })}
            aspect="feature"
            hint="4:5 portrait slot - image fills the frame"
          />
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Section number" value={content.farmers.number} onChange={(v) => patch("farmers", { ...content.farmers, number: v })} />
              <Field label="Image alt" value={content.farmers.imageAlt} onChange={(v) => patch("farmers", { ...content.farmers, imageAlt: v })} />
            </div>
            <Field label="Title" value={content.farmers.title} onChange={(v) => patch("farmers", { ...content.farmers, title: v })} />
            <Field label="Title accent" value={content.farmers.titleAccent} onChange={(v) => patch("farmers", { ...content.farmers, titleAccent: v })} />
            <Field label="Paragraph 1" value={content.farmers.paragraph1} onChange={(v) => patch("farmers", { ...content.farmers, paragraph1: v })} multiline />
            <Field label="Paragraph 2" value={content.farmers.paragraph2} onChange={(v) => patch("farmers", { ...content.farmers, paragraph2: v })} multiline />
            <BulletEditor bullets={content.farmers.bullets} onChange={(b) => patch("farmers", { ...content.farmers, bullets: b })} />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Field label="Overlay label" value={content.farmers.overlayLabel} onChange={(v) => patch("farmers", { ...content.farmers, overlayLabel: v })} />
              <Field label="Overlay text" value={content.farmers.overlayText} onChange={(v) => patch("farmers", { ...content.farmers, overlayText: v })} />
            </div>
          </div>
        </div>
      </Section>

      <Section title="For Verifiers" index={5}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
          <ImageField
            label="Feature image"
            value={content.verifiers.imageUrl}
            onChange={(v) => patch("verifiers", { ...content.verifiers, imageUrl: v })}
            aspect="feature"
          />
          <div className="space-y-3">
            <Field label="Title" value={content.verifiers.title} onChange={(v) => patch("verifiers", { ...content.verifiers, title: v })} />
            <Field label="Title accent" value={content.verifiers.titleAccent} onChange={(v) => patch("verifiers", { ...content.verifiers, titleAccent: v })} />
            <Field label="Paragraph 1" value={content.verifiers.paragraph1} onChange={(v) => patch("verifiers", { ...content.verifiers, paragraph1: v })} multiline />
            <Field label="Paragraph 2" value={content.verifiers.paragraph2} onChange={(v) => patch("verifiers", { ...content.verifiers, paragraph2: v })} multiline />
            <BulletEditor bullets={content.verifiers.bullets} onChange={(b) => patch("verifiers", { ...content.verifiers, bullets: b })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Overlay label" value={content.verifiers.overlayLabel} onChange={(v) => patch("verifiers", { ...content.verifiers, overlayLabel: v })} />
              <Field label="Overlay text" value={content.verifiers.overlayText} onChange={(v) => patch("verifiers", { ...content.verifiers, overlayText: v })} />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Marketplace" index={6}>
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Section label" value={content.marketplace.sectionLabel} onChange={(v) => patch("marketplace", { ...content.marketplace, sectionLabel: v })} />
            <Field label="Paragraph" value={content.marketplace.paragraph} onChange={(v) => patch("marketplace", { ...content.marketplace, paragraph: v })} multiline />
            <Field label="Heading" value={content.marketplace.heading} onChange={(v) => patch("marketplace", { ...content.marketplace, heading: v })} />
            <Field label="Heading emphasis" value={content.marketplace.headingEmphasis} onChange={(v) => patch("marketplace", { ...content.marketplace, headingEmphasis: v })} />
          </div>
          <CardEditor
            cards={content.marketplace.cards}
            onChange={(cards) => patch("marketplace", { ...content.marketplace, cards })}
          />
        </div>
      </Section>

      <Section title="Traceability" index={7}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
          <ImageField
            label="Feature image"
            value={content.traceability.imageUrl}
            onChange={(v) => patch("traceability", { ...content.traceability, imageUrl: v })}
            aspect="feature"
          />
          <div className="space-y-3">
            <Field label="Title" value={content.traceability.title} onChange={(v) => patch("traceability", { ...content.traceability, title: v })} />
            <Field label="Title accent" value={content.traceability.titleAccent} onChange={(v) => patch("traceability", { ...content.traceability, titleAccent: v })} />
            <Field label="Paragraph" value={content.traceability.paragraph} onChange={(v) => patch("traceability", { ...content.traceability, paragraph: v })} multiline />
            <BulletEditor bullets={content.traceability.bullets} onChange={(b) => patch("traceability", { ...content.traceability, bullets: b })} />
          </div>
        </div>
      </Section>

      <Section title="Technology" index={8}>
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Section label" value={content.technology.sectionLabel} onChange={(v) => patch("technology", { ...content.technology, sectionLabel: v })} />
            <Field label="Paragraph" value={content.technology.paragraph} onChange={(v) => patch("technology", { ...content.technology, paragraph: v })} multiline />
            <Field label="Heading" value={content.technology.heading} onChange={(v) => patch("technology", { ...content.technology, heading: v })} />
            <Field label="Heading emphasis" value={content.technology.headingEmphasis} onChange={(v) => patch("technology", { ...content.technology, headingEmphasis: v })} />
          </div>
          <p className={dc.labelSm}>Row 1 cards</p>
          <CardEditor cards={content.technology.row1} onChange={(row1) => patch("technology", { ...content.technology, row1 })} compact />
          <p className={dc.labelSm}>Row 2 cards</p>
          <CardEditor cards={content.technology.row2} onChange={(row2) => patch("technology", { ...content.technology, row2 })} compact />
        </div>
      </Section>

      <Section title="Impact Metrics" index={9}>
        <div className="space-y-4 pt-4">
          <Field label="Section label" value={content.metrics.sectionLabel} onChange={(v) => patch("metrics", { ...content.metrics, sectionLabel: v })} />
          {content.metrics.items.map((m, i) => (
            <MetricRow
              key={m.id}
              metric={m}
              onChange={(metric) => {
                const items = [...content.metrics.items];
                items[i] = metric;
                patch("metrics", { ...content.metrics, items });
              }}
              onRemove={() => {
                if (content.metrics.items.length <= 1) return;
                patch("metrics", { ...content.metrics, items: content.metrics.items.filter((x) => x.id !== m.id) });
              }}
            />
          ))}
          <button
            type="button"
            onClick={() =>
              patch("metrics", {
                ...content.metrics,
                items: [
                  ...content.metrics.items,
                  { id: newId("m"), value: "0", label: "New metric", desc: "" },
                ],
              })
            }
            className={dc.btnSecondary + " inline-flex items-center gap-2"}
          >
            <Plus className="h-4 w-4" /> Add metric
          </button>
        </div>
      </Section>

      <Section title="Reviews & Testimonials" index={10}>
        <div className="space-y-4 pt-4">
          {content.testimonials.map((t, i) => (
            <TestimonialRow
              key={t.id}
              testimonial={t}
              onChange={(testimonial) => {
                const testimonials = [...content.testimonials];
                testimonials[i] = testimonial;
                patch("testimonials", testimonials);
              }}
              onRemove={() => {
                if (content.testimonials.length <= 1) return;
                patch("testimonials", content.testimonials.filter((x) => x.id !== t.id));
              }}
            />
          ))}
          <button
            type="button"
            onClick={() =>
              patch("testimonials", [
                ...content.testimonials,
                { id: newId("test"), name: "", role: "", quote: "" },
              ])
            }
            className={dc.btnSecondary + " inline-flex items-center gap-2"}
          >
            <Plus className="h-4 w-4" /> Add review
          </button>
        </div>
      </Section>

      <Section title="Final CTA & Footer" index={11}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
          <ImageField
            label="CTA background"
            value={content.cta.imageUrl}
            onChange={(v) => patch("cta", { ...content.cta, imageUrl: v })}
            aspect="cta"
          />
          <div className="space-y-3">
            <Field label="CTA label" value={content.cta.label} onChange={(v) => patch("cta", { ...content.cta, label: v })} />
            <Field label="CTA heading" value={content.cta.heading} onChange={(v) => patch("cta", { ...content.cta, heading: v })} />
            <Field label="CTA paragraph" value={content.cta.paragraph} onChange={(v) => patch("cta", { ...content.cta, paragraph: v })} multiline />
            <Field label="Footer description" value={content.footer.description} onChange={(v) => patch("footer", { ...content.footer, description: v })} multiline />
            <Field label="Copyright line" value={content.footer.copyright} onChange={(v) => patch("footer", { ...content.footer, copyright: v })} />
          </div>
        </div>
      </Section>

      <div className="sticky bottom-4 flex justify-end mt-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty}
          style={{ background: D.deep, color: D.lime }}
          className="px-8 py-3 rounded-2xl font-bold text-sm shadow-lg inline-flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save landing page
        </button>
      </div>
    </div>
  );
}

function CardEditor({
  cards,
  onChange,
  compact,
}: {
  cards: LandingCard[];
  onChange: (cards: LandingCard[]) => void;
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      {cards.map((c, i) => (
        <div key={c.id} className={dc.softCard + " p-4 space-y-2"}>
          <div className="flex justify-between items-center">
            <span className={dc.badge}>Card {c.idx}</span>
            <button
              type="button"
              onClick={() => onChange(cards.filter((x) => x.id !== c.id))}
              className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Field label="Index" value={c.idx} onChange={(v) => { const n = [...cards]; n[i] = { ...c, idx: v }; onChange(n); }} />
            <Field label="Icon name" value={c.icon} onChange={(v) => { const n = [...cards]; n[i] = { ...c, icon: v }; onChange(n); }} />
            <Field label="Title" value={c.title} onChange={(v) => { const n = [...cards]; n[i] = { ...c, title: v }; onChange(n); }} />
            {!compact && (
              <Field label="Description" value={c.desc} onChange={(v) => { const n = [...cards]; n[i] = { ...c, desc: v }; onChange(n); }} multiline />
            )}
          </div>
          {compact && (
            <Field label="Description" value={c.desc} onChange={(v) => { const n = [...cards]; n[i] = { ...c, desc: v }; onChange(n); }} multiline />
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange([
            ...cards,
            { id: newId("card"), idx: String(cards.length + 1).padStart(2, "0"), icon: "Star", title: "", desc: "" },
          ])
        }
        className={dc.btnSecondary + " inline-flex items-center gap-2"}
      >
        <Plus className="h-4 w-4" /> Add card
      </button>
    </div>
  );
}

function MetricRow({
  metric,
  onChange,
  onRemove,
}: {
  metric: LandingMetric;
  onChange: (m: LandingMetric) => void;
  onRemove: () => void;
}) {
  return (
    <div className={dc.softCard + " p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-start"}>
      <Field label="Value" value={metric.value} onChange={(v) => onChange({ ...metric, value: v })} />
      <Field label="Label" value={metric.label} onChange={(v) => onChange({ ...metric, label: v })} />
      <Field label="Description" value={metric.desc} onChange={(v) => onChange({ ...metric, desc: v })} multiline />
      <button type="button" onClick={onRemove} className="mt-6 p-2 rounded-xl border border-red-200 text-red-500 self-start">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function TestimonialRow({
  testimonial,
  onChange,
  onRemove,
}: {
  testimonial: LandingTestimonial;
  onChange: (t: LandingTestimonial) => void;
  onRemove: () => void;
}) {
  return (
    <div className={dc.softCard + " p-4 space-y-3"}>
      <div className="flex items-center justify-between">
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-[#BFFF00] text-[#BFFF00]" />
          ))}
        </div>
        <button type="button" onClick={onRemove} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <Field label="Quote" value={testimonial.quote} onChange={(v) => onChange({ ...testimonial, quote: v })} multiline />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name" value={testimonial.name} onChange={(v) => onChange({ ...testimonial, name: v })} />
        <Field label="Role / location" value={testimonial.role} onChange={(v) => onChange({ ...testimonial, role: v })} />
      </div>
    </div>
  );
}
