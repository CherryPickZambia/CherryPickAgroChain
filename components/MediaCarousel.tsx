"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MediaCarouselProps {
  photos: string[];
  videos?: string[];
  /** dark = trace page; light = lookup page */
  tone?: "dark" | "light";
}

export default function MediaCarousel({ photos, videos = [], tone = "dark" }: MediaCarouselProps) {
  const slides: Array<{ type: "photo" | "video"; url: string }> = [
    ...videos.map((url) => ({ type: "video" as const, url })),
    ...photos.map((url) => ({ type: "photo" as const, url })),
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [photos.join("|"), videos.join("|")]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 4500);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const dark = tone === "dark";
  const border = dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(12,45,58,0.08)";
  const btnBg = dark ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.92)";
  const btnColor = dark ? "#fff" : "#0C2D3A";

  const go = (dir: -1 | 1) => setIndex((i) => (i + dir + slides.length) % slides.length);
  const current = slides[index];

  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border, background: dark ? "#000" : "#F7F9FB" }}>
      <div style={{ aspectRatio: "16 / 10", width: "100%", position: "relative" }}>
        {current.type === "video" ? (
          <video
            key={current.url}
            src={current.url}
            controls
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={current.url}
            src={current.url}
            alt="Behind the scenes"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={() => go(-1)}
            style={{
              position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
              width: 36, height: 36, borderRadius: "50%", border: "none",
              background: btnBg, color: btnColor, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ChevronLeft style={{ width: 18, height: 18 }} />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => go(1)}
            style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              width: 36, height: 36, borderRadius: "50%", border: "none",
              background: btnBg, color: btnColor, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ChevronRight style={{ width: 18, height: 18 }} />
          </button>
          <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 6 }}>
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => setIndex(i)}
                style={{
                  width: i === index ? 18 : 8, height: 8, borderRadius: 99, border: "none",
                  background: i === index ? "#BFFF00" : dark ? "rgba(255,255,255,0.35)" : "rgba(12,45,58,0.25)",
                  cursor: "pointer", padding: 0, transition: "width .2s",
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* Thumbnail strip when many images */}
      {photos.length > 1 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "10px 12px", background: dark ? "rgba(0,0,0,0.35)" : "#fff" }}>
          {slides.map((s, i) => (
            <button
              key={`${s.url}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              style={{
                flex: "0 0 auto", width: 56, height: 56, borderRadius: 10, overflow: "hidden", padding: 0,
                border: i === index ? "2px solid #BFFF00" : border, cursor: "pointer", background: "#111",
              }}
            >
              {s.type === "video" ? (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18 }}>▶</div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
