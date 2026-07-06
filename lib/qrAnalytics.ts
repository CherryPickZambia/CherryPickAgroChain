import { supabase } from "./supabase";

export interface QrScanContext {
  batchCode?: string;
  batchId?: string;
  retailOutlet?: string;
}

function makeScanId(): string {
  // Compact, URL-safe unique id used as the consumer's scan reference.
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SC-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

function detectDeviceType(ua: string): string {
  const s = ua.toLowerCase();
  if (/ipad|tablet/.test(s)) return "Tablet";
  if (/mobi|iphone|android/.test(s)) return "Mobile";
  return "Desktop";
}

interface GeoResult {
  country: string;
  location: string;
}

/**
 * Best-effort country-level geolocation from the visitor's IP.
 * Uses a free, keyless, CORS-friendly provider with a short timeout so it can
 * never stall the scan capture. Returns null on any failure so the caller can
 * fall back to timezone-derived values.
 */
async function fetchGeo(): Promise<GeoResult | null> {
  const url = process.env.NEXT_PUBLIC_GEOIP_URL || "https://ipapi.co/json/";
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timer);
    if (!res.ok) return null;
    const d: any = await res.json();
    // Normalise across the common free providers (ipapi.co / ipwho.is / geojs).
    const country = d.country_name || d.country || d.countryName || "";
    const city = d.city || "";
    const region = d.region || d.region_name || d.state || "";
    const parts = [city, region, country].filter(Boolean);
    if (!country && parts.length === 0) return null;
    return { country, location: parts.join(", ") };
  } catch {
    return null;
  }
}

/**
 * Records a QR scan for analytics and returns the generated scan reference so
 * the page can attach it to complaints. First vs repeat scan is detected per
 * batch via localStorage. Fire-and-forget: never throws to the caller.
 */
export async function recordScan(ctx: QrScanContext): Promise<string> {
  const scanId = makeScanId();
  try {
    if (typeof window === "undefined") return scanId;

    const key = `cp_scanned_${ctx.batchCode || ctx.batchId || "unknown"}`;
    const isRepeat = !!window.localStorage.getItem(key);
    try { window.localStorage.setItem(key, new Date().toISOString()); } catch { /* ignore */ }

    const ua = navigator.userAgent || "";
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";

    // Prefer IP-based country-level geolocation; fall back to the timezone
    // region (e.g. "Africa/Lusaka" -> "Africa") when the lookup is unavailable.
    const geo = await fetchGeo();
    const country = geo?.country || (timezone.includes("/") ? timezone.split("/")[0] : "");
    const approxLocation = geo?.location || timezone;

    if (supabase) {
      await supabase.from("qr_scans").insert({
        scan_id: scanId,
        batch_code: ctx.batchCode || null,
        batch_id: ctx.batchId || null,
        device_type: detectDeviceType(ua),
        country,
        approx_location: approxLocation,
        timezone,
        language: navigator.language || "",
        is_repeat: isRepeat,
        referrer: document.referrer || "",
        user_agent: ua.slice(0, 400),
        retail_outlet: ctx.retailOutlet || null,
      });
    }
  } catch (e) {
    // Analytics must never break the consumer experience.
    console.warn("recordScan failed:", e);
  }
  return scanId;
}

export interface QrAnalyticsSummary {
  totalScans: number;
  uniqueScans: number;
  repeatScans: number;
  topBatches: { batchCode: string; scans: number }[];
  byDevice: { device: string; scans: number }[];
  byCountry: { country: string; scans: number }[];
  scansLast7Days: number;
}

export async function getQrAnalytics(): Promise<QrAnalyticsSummary> {
  const empty: QrAnalyticsSummary = {
    totalScans: 0, uniqueScans: 0, repeatScans: 0, topBatches: [], byDevice: [], byCountry: [], scansLast7Days: 0,
  };
  if (!supabase) return empty;
  try {
    const { data, error } = await supabase
      .from("qr_scans")
      .select("scan_id, batch_code, device_type, country, is_repeat, created_at")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error || !data) return empty;

    const totalScans = data.length;
    const uniqueScanIds = new Set(data.map((r: any) => r.scan_id));
    const repeatScans = data.filter((r: any) => r.is_repeat).length;

    const batchCounts: Record<string, number> = {};
    const deviceCounts: Record<string, number> = {};
    const countryCounts: Record<string, number> = {};
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let scansLast7Days = 0;

    data.forEach((r: any) => {
      const code = r.batch_code || "-";
      batchCounts[code] = (batchCounts[code] || 0) + 1;
      const dev = r.device_type || "Unknown";
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
      const country = r.country || "Unknown";
      countryCounts[country] = (countryCounts[country] || 0) + 1;
      if (r.created_at && new Date(r.created_at).getTime() >= weekAgo) scansLast7Days += 1;
    });

    const topBatches = Object.entries(batchCounts)
      .map(([batchCode, scans]) => ({ batchCode, scans }))
      .sort((a, b) => b.scans - a.scans)
      .slice(0, 8);
    const byDevice = Object.entries(deviceCounts)
      .map(([device, scans]) => ({ device, scans }))
      .sort((a, b) => b.scans - a.scans);
    const byCountry = Object.entries(countryCounts)
      .map(([country, scans]) => ({ country, scans }))
      .sort((a, b) => b.scans - a.scans)
      .slice(0, 8);

    return {
      totalScans,
      uniqueScans: uniqueScanIds.size,
      repeatScans,
      topBatches,
      byDevice,
      byCountry,
      scansLast7Days,
    };
  } catch (e) {
    console.error("getQrAnalytics:", e);
    return empty;
  }
}

/** Total scan count for a single batch (used for the live "QR scans" counter). */
export async function getScanCount(): Promise<number> {
  if (!supabase) return 0;
  try {
    const { count } = await supabase.from("qr_scans").select("id", { count: "exact", head: true });
    return count || 0;
  } catch {
    return 0;
  }
}
