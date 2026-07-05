import { supabase } from "./supabase";

export interface PlatformSettings {
  platformName: string;
  currency: string;
  timezone: string;
  language: string;
  officerFeePercent: number;
  officerFeeFlat: number;
  officerFeeThreshold: number;
  autoApproveFarmers: boolean;
  minListingQuality: string;
  platformFeePercent: number;
  paymentNetwork: string;
}

export const DEFAULT_SETTINGS: PlatformSettings = {
  platformName: "Cherry Pick",
  currency: "ZMW (Kwacha)",
  timezone: "Africa/Lusaka",
  language: "English",
  officerFeePercent: 5,
  officerFeeFlat: 150,
  officerFeeThreshold: 2000,
  autoApproveFarmers: true,
  minListingQuality: "Grade B",
  platformFeePercent: 2.5,
  paymentNetwork: "Base (Coinbase L2)",
};

const ROW_ID = "platform";
const LS_KEY = "cherrypick_platform_settings";

export async function loadPlatformSettings(): Promise<PlatformSettings> {
  // Try Supabase first, then localStorage, always merged over defaults.
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("data")
        .eq("id", ROW_ID)
        .single();
      if (!error && data?.data) {
        return { ...DEFAULT_SETTINGS, ...(data.data as Partial<PlatformSettings>) };
      }
    }
  } catch {
    /* table may not exist yet — fall through */
  }
  try {
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem(LS_KEY);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_SETTINGS };
}

export async function savePlatformSettings(settings: PlatformSettings): Promise<void> {
  // Persist to localStorage immediately (always works), then best-effort to DB.
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LS_KEY, JSON.stringify(settings));
    }
  } catch {
    /* ignore */
  }
  if (supabase) {
    const { error } = await supabase
      .from("platform_settings")
      .upsert({ id: ROW_ID, data: settings, updated_at: new Date().toISOString() });
    if (error && !/relation .*platform_settings.* does not exist/i.test(error.message || "")) {
      throw error;
    }
  }
}
