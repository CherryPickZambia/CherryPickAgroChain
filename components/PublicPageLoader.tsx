"use client";

import { P, FS } from "@/lib/publicPageTheme";

export default function PublicPageLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: P.deep,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FS,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: `2px solid ${P.border}`,
            borderTopColor: P.accent,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <p style={{ color: P.secondary, fontSize: 14 }}>{label}</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
