"use client";

import { useState } from "react";
import { submitComplaint, type ComplaintInput } from "@/lib/complaints";

const LIME = "#BFFF00";
const ACCENT = "#4ade80";

const ISSUE_TYPES = [
  "Product quality",
  "Packaging problem",
  "Wrong or missing information",
  "Best-before / freshness",
  "Foreign object / safety concern",
  "Suggestion / feedback",
  "Other",
];

export interface ComplaintContext {
  batchCode?: string;
  batchId?: string;
  productName?: string;
  processingDate?: string;
  scanReference?: string;
  farmerBatch?: string;
  retailOutlet?: string;
}

export default function ComplaintModal({
  open,
  onClose,
  context,
}: {
  open: boolean;
  onClose: () => void;
  context: ComplaintContext;
}) {
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
  const [description, setDescription] = useState("");
  const [retailOutlet, setRetailOutlet] = useState(context.retailOutlet || "");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(files).slice(0, 4)) {
        const form = new FormData();
        form.append("file", file);
        form.append("intent", "image");
        const res = await fetch("/api/upload/media", { method: "POST", body: form });
        if (res.ok) {
          const json = await res.json();
          if (json.url) setPhotos((p) => [...p, json.url]);
        } else {
          // Non-fatal: photo hosting may be unconfigured; allow text-only reports.
          setError("Photo upload unavailable right now - you can still submit without photos.");
        }
      }
    } catch {
      setError("Photo upload failed - you can still submit without photos.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError("Please describe the issue so we can investigate.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const payload: ComplaintInput = {
        ...context,
        retailOutlet: retailOutlet || context.retailOutlet,
        issueType,
        description: description.trim(),
        photos,
        contactName: contactName.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
      };
      await submitComplaint(payload);
      setDone(true);
    } catch (e: any) {
      setError(e?.message || "Could not submit right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const label: React.CSSProperties = {
    fontSize: 11, color: "#9aa89d", fontFamily: "'Space Mono', monospace",
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, display: "block",
  };
  const input: React.CSSProperties = {
    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12, padding: "12px 14px", color: "#fff", fontSize: 15, fontFamily: "'Inter', sans-serif",
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(2,5,3,0.75)", backdropFilter: "blur(6px)",
        zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 0,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto",
          background: "#0b1410", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "24px 24px 0 0", padding: 24, boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
        }}
      >
        {done ? (
          <div style={{ textAlign: "center", padding: "24px 8px" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
            <h3 style={{ color: "#fff", fontFamily: "'Playfair Display', serif", fontSize: 24, margin: "0 0 8px" }}>
              Thank you
            </h3>
            <p style={{ color: "#9aa89d", fontSize: 14, lineHeight: 1.6, margin: "0 0 20px" }}>
              Your report has been logged against batch <strong style={{ color: ACCENT }}>{context.batchCode}</strong>.
              Our quality team can now trace it end-to-end. If you left contact details we&apos;ll be in touch.
            </p>
            <button onClick={onClose} style={{ background: ACCENT, color: "#020503", border: "none", borderRadius: 12, padding: "14px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div>
                <span style={{ color: ACCENT, fontSize: 11, fontFamily: "'Space Mono', monospace", letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>
                  Help Us Improve
                </span>
                <h3 style={{ color: "#fff", fontFamily: "'Playfair Display', serif", fontSize: 26, margin: "6px 0 0" }}>
                  Report an Issue
                </h3>
              </div>
              <button onClick={onClose} aria-label="Close" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", width: 36, height: 36, borderRadius: "50%", fontSize: 18, cursor: "pointer", flexShrink: 0 }}>×</button>
            </div>

            {/* Inherited batch context (read-only) */}
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "12px 14px", margin: "16px 0 20px" }}>
              <p style={{ ...label, marginBottom: 8 }}>Automatically attached</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", fontSize: 12 }}>
                <Ctx k="Batch" v={context.batchCode} />
                <Ctx k="Product" v={context.productName} />
                <Ctx k="Processed" v={context.processingDate} />
                <Ctx k="Scan Ref" v={context.scanReference} />
                {context.farmerBatch && <Ctx k="Farmer Batch" v={context.farmerBatch} />}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={label}>Issue Type</label>
              <select value={issueType} onChange={(e) => setIssueType(e.target.value)} style={{ ...input, appearance: "none" }}>
                {ISSUE_TYPES.map((t) => (
                  <option key={t} value={t} style={{ background: "#0b1410" }}>{t}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={label}>Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Tell us what happened..."
                style={{ ...input, resize: "vertical", minHeight: 96 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={label}>Retail Outlet (if known)</label>
              <input value={retailOutlet} onChange={(e) => setRetailOutlet(e.target.value)} placeholder="e.g. Shoprite Manda Hill" style={input} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={label}>Photos (optional)</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                {photos.map((p, i) => (
                  <img key={i} src={p} alt="Evidence" style={{ width: 60, height: 60, borderRadius: 10, objectFit: "cover", border: "1px solid rgba(255,255,255,0.12)" }} />
                ))}
              </div>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.2)", borderRadius: 12, padding: "10px 16px", cursor: "pointer", color: "#9aa89d", fontSize: 13 }}>
                {uploading ? "Uploading..." : "📷 Add photos"}
                <input type="file" accept="image/*" multiple hidden disabled={uploading} onChange={(e) => handleUpload(e.target.files)} />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 }}>
              <div>
                <label style={label}>Your Name</label>
                <input value={contactName} onChange={(e) => setContactName(e.target.value)} style={input} />
              </div>
              <div>
                <label style={label}>Phone</label>
                <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} style={input} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={label}>Email</label>
              <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} type="email" style={input} />
            </div>

            {error && (
              <p style={{ color: "#fca5a5", fontSize: 13, margin: "0 0 14px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 10, padding: "10px 12px" }}>
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                width: "100%", background: LIME, color: "#020503", border: "none", borderRadius: 14,
                padding: "16px", fontSize: 15, fontWeight: 800, cursor: submitting ? "wait" : "pointer",
                opacity: submitting ? 0.7 : 1, fontFamily: "'Inter', sans-serif",
              }}
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Ctx({ k, v }: { k: string; v?: string }) {
  return (
    <div>
      <span style={{ color: "#5b6b5e", fontFamily: "'Space Mono', monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>{k}</span>
      <div style={{ color: "#fff", fontWeight: 600, wordBreak: "break-word" }}>{v || "-"}</div>
    </div>
  );
}
