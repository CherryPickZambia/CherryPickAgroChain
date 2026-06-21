/** ARKTOS dashboard design tokens — shared across role dashboards */

export const D = {
  deep: "#0C2D3A",
  lime: "#BFFF00",
  muted: "#5A7684",
  secondary: "#94B3C1",
  sand: "#E6E2D6",
  surface: "#F7F9FB",
  hover: "#1a4050",
  white: "#FFFFFF",
} as const;

export const syne = { fontFamily: "'Syne', sans-serif" } as const;
export const manrope = { fontFamily: "'Manrope', sans-serif" } as const;

/** Tailwind class bundles for consistent dashboard UI */
export const dc = {
  panel: "dashboard-panel rounded-2xl",
  softCard: "dashboard-soft-card rounded-xl",
  listItem: "dashboard-list-item flex items-start gap-3 p-3 rounded-xl",
  statCard: "dashboard-stat-card rounded-2xl p-5 transition-shadow",

  label: "text-xs uppercase tracking-wider text-[#5A7684] font-semibold",
  labelSm: "text-sm text-[#5A7684]",
  value: "text-3xl font-bold text-[#0C2D3A]",
  valueSm: "text-sm font-semibold text-[#0C2D3A]",
  sub: "text-xs text-[#94B3C1] mt-1",
  heading: "text-lg font-bold text-[#0C2D3A]",
  headingLg: "text-3xl font-bold text-[#0C2D3A]",

  iconBox: "dashboard-arktos-icon-box",
  iconBoxLime: "dashboard-arktos-icon-box dashboard-arktos-icon-box--lime",
  icon: "h-4 w-4 text-[#0C2D3A]",
  iconLime: "h-5 w-5 text-[#BFFF00]",

  link: "text-sm font-semibold text-[#0C2D3A] hover:text-[#1a4050] transition-colors",
  badge: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-[#0C2D3A]/8 text-[#0C2D3A] border border-[#0C2D3A]/10",
  badgeLime: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-[#0C2D3A] text-[#BFFF00]",

  statusBanner: "dashboard-arktos-status rounded-xl p-4",
  statusDot: "w-2 h-2 rounded-full bg-[#BFFF00] animate-pulse",
  statusActive: "text-sm font-semibold text-[#0C2D3A]",

  metricBadge: "px-4 py-2 rounded-xl bg-[#0C2D3A] text-[#BFFF00] font-bold text-2xl",
  fieldRow: "dashboard-arktos-field flex items-center gap-3 rounded-xl px-4 py-3",
  alertBox: "dashboard-arktos-alert rounded-xl p-4",
  infoBox: "dashboard-arktos-info rounded-xl p-4",

  btnPrimary: "dashboard-button-primary px-4 py-2.5 text-white rounded-xl text-sm font-semibold",
  btnSecondary: "dashboard-button-secondary px-4 py-2.5 rounded-xl text-sm font-semibold",

  input:
    "w-full px-4 py-2 bg-white/80 border border-[#0C2D3A]/10 rounded-xl text-sm text-[#0C2D3A] placeholder-[#94B3C1] focus:outline-none focus:ring-2 focus:ring-[#BFFF00]/40 focus:border-[#0C2D3A]/20",
  select:
    "text-sm border border-[#0C2D3A]/10 rounded-xl px-3 py-1.5 bg-white/80 text-[#0C2D3A] focus:outline-none focus:ring-2 focus:ring-[#BFFF00]/40",
} as const;
