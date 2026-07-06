"use client";

import { useEffect, useState } from "react";
import { QrCode, MessageSquareWarning, Smartphone, Repeat, Users, Loader2 } from "lucide-react";
import { getQrAnalytics, type QrAnalyticsSummary } from "@/lib/qrAnalytics";
import { getComplaints, updateComplaintStatus, type Complaint } from "@/lib/complaints";

const DEEP = "#0C2D3A";
const MUTE = "#5A7684";
const LIME = "#BFFF00";

const STATUS_OPTIONS = ["open", "investigating", "resolved", "dismissed"];

export default function AdminConsumerQR() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<QrAnalyticsSummary | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [a, c] = await Promise.all([getQrAnalytics(), getComplaints()]);
    setAnalytics(a);
    setComplaints(c);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleStatus = async (id: string, status: string) => {
    setSavingId(id);
    try {
      await updateComplaintStatus(id, status);
      setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    } catch {
      /* ignore */
    } finally {
      setSavingId(null);
    }
  };

  const openCount = complaints.filter((c) => c.status === "open").length;

  const stat = (label: string, value: string | number, Icon: any) => (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(12,45,58,0.06)", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: MUTE }}>{label}</div>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: DEEP, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon style={{ width: 16, height: 16, color: LIME }} />
        </div>
      </div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "2rem", color: DEEP, marginTop: 8 }}>{value}</div>
    </div>
  );

  return (
    <div style={{ background: "#F7F9FB", borderRadius: 24, overflow: "hidden" }}>
      <div style={{ padding: "48px 40px 0" }}>
        <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: MUTE, borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 16 }}>
          Consumer Experience v1.0
        </div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(2rem,5vw,4rem)", lineHeight: 0.9, letterSpacing: "-0.04em", color: DEEP, marginBottom: 48 }}>
          QR &amp;<br />COMPLAINTS
        </h1>
      </div>

      {loading ? (
        <div style={{ padding: "0 40px 60px", display: "flex", alignItems: "center", gap: 10, color: MUTE }}>
          <Loader2 className="animate-spin" style={{ width: 18, height: 18 }} /> Loading consumer data...
        </div>
      ) : (
        <>
          {/* QR analytics */}
          <div style={{ padding: "0 40px 40px" }}>
            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: MUTE, borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 16 }}>01. QR Scan Analytics</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
              {stat("Total Scans", analytics?.totalScans ?? 0, QrCode)}
              {stat("Unique Scans", analytics?.uniqueScans ?? 0, Users)}
              {stat("Repeat Scans", analytics?.repeatScans ?? 0, Repeat)}
              {stat("Scans (7 days)", analytics?.scansLast7Days ?? 0, Smartphone)}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(12,45,58,0.06)", padding: 24 }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: DEEP, marginBottom: 14 }}>Most Scanned Batches</div>
                {(analytics?.topBatches || []).length === 0 ? (
                  <p style={{ fontFamily: "'Manrope',sans-serif", color: MUTE, fontSize: 14 }}>No scans yet.</p>
                ) : (
                  analytics!.topBatches.map((b) => (
                    <div key={b.batchCode} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(12,45,58,0.05)" }}>
                      <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: DEEP, fontWeight: 600 }}>{b.batchCode}</span>
                      <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: MUTE }}>{b.scans} scans</span>
                    </div>
                  ))
                )}
              </div>
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(12,45,58,0.06)", padding: 24 }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: DEEP, marginBottom: 14 }}>By Device</div>
                {(analytics?.byDevice || []).length === 0 ? (
                  <p style={{ fontFamily: "'Manrope',sans-serif", color: MUTE, fontSize: 14 }}>No data yet.</p>
                ) : (
                  analytics!.byDevice.map((d) => (
                    <div key={d.device} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(12,45,58,0.05)" }}>
                      <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: DEEP, fontWeight: 600 }}>{d.device}</span>
                      <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: MUTE }}>{d.scans}</span>
                    </div>
                  ))
                )}
              </div>
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(12,45,58,0.06)", padding: 24 }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: DEEP, marginBottom: 14 }}>By Country</div>
                {(analytics?.byCountry || []).length === 0 ? (
                  <p style={{ fontFamily: "'Manrope',sans-serif", color: MUTE, fontSize: 14 }}>No data yet.</p>
                ) : (
                  analytics!.byCountry.map((c) => (
                    <div key={c.country} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(12,45,58,0.05)" }}>
                      <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: DEEP, fontWeight: 600 }}>{c.country}</span>
                      <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: MUTE }}>{c.scans}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Complaints */}
          <div style={{ padding: "0 40px 60px" }}>
            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, color: MUTE, borderBottom: "1px solid rgba(12,45,58,0.1)", paddingBottom: 8, marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
              <span>02. Complaints &amp; Feedback</span>
              {openCount > 0 && <span style={{ color: "#c2410c" }}>{openCount} open</span>}
            </div>
            {complaints.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", background: "#fff", borderRadius: 16, border: "1px dashed rgba(12,45,58,0.15)" }}>
                <MessageSquareWarning className="h-12 w-12 mx-auto mb-3" style={{ color: "rgba(12,45,58,0.2)" }} />
                <p style={{ fontFamily: "'Manrope',sans-serif", color: MUTE }}>No complaints submitted yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {complaints.map((c) => (
                  <div key={c.id} style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(12,45,58,0.06)", padding: "18px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 240 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: DEEP }}>{c.issueType}</span>
                          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: MUTE, background: "rgba(12,45,58,0.05)", padding: "2px 10px", borderRadius: 999 }}>{c.batchCode || "-"}</span>
                          {c.productName && <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: MUTE }}>{c.productName}</span>}
                        </div>
                        <p style={{ fontFamily: "'Manrope',sans-serif", fontSize: 14, color: "#334155", margin: "0 0 8px", lineHeight: 1.5 }}>{c.description}</p>
                        <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: MUTE, display: "flex", gap: 14, flexWrap: "wrap" }}>
                          {c.scanReference && <span>Scan: {c.scanReference}</span>}
                          {c.retailOutlet && <span>Outlet: {c.retailOutlet}</span>}
                          {c.farmerBatch && <span>Farmer batch: {c.farmerBatch}</span>}
                          {(c.contactName || c.contactEmail || c.contactPhone) && (
                            <span>Contact: {[c.contactName, c.contactEmail, c.contactPhone].filter(Boolean).join(" · ")}</span>
                          )}
                          <span>{c.created_at ? new Date(c.created_at).toLocaleDateString() : ""}</span>
                        </div>
                        {c.photos && c.photos.length > 0 && (
                          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                            {c.photos.map((p, i) => (
                              <a key={i} href={p} target="_blank" rel="noopener noreferrer">
                                <img src={p} alt="Evidence" style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", border: "1px solid rgba(12,45,58,0.1)" }} />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {savingId === c.id && <Loader2 className="animate-spin" style={{ width: 14, height: 14, color: MUTE }} />}
                        <select
                          value={c.status}
                          onChange={(e) => handleStatus(c.id, e.target.value)}
                          style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 600, color: DEEP, border: "1px solid rgba(12,45,58,0.15)", borderRadius: 10, padding: "8px 12px", background: "#fff", cursor: "pointer", textTransform: "capitalize" }}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
