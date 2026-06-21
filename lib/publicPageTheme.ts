/** Shared landing / lookup / public error page palette */
export const P = {
  deep: "#020503",
  surface: "#07120a",
  white: "#ffffff",
  primary: "#e0e7e3",
  secondary: "#9aa89d",
  muted: "#5b6b5e",
  accent: "#4ade80",
  border: "rgba(255,255,255,0.08)",
  borderG: "rgba(74,222,128,0.15)",
} as const;

export const FD = "'Playfair Display', serif";
export const FS = "'Inter', sans-serif";
export const FM = "'Space Mono', monospace";

export function userFacingTraceError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("failed to fetch") || m.includes("network") || m.includes("load failed")) {
    return "We could not reach the traceability server. Check your connection and try again.";
  }
  if (m.includes("not configured") || m.includes("supabase")) {
    return "Traceability is temporarily unavailable. Please try again in a moment.";
  }
  if (m.includes("not found")) {
    return "No batch matched that code. Double-check the label and try again.";
  }
  return message;
}
