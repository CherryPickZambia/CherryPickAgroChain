import { supabase } from "@/lib/supabase";

export interface LandingTestimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
}

export interface LandingCard {
  id: string;
  idx: string;
  icon: string;
  title: string;
  desc: string;
}

export interface LandingMetric {
  id: string;
  value: string;
  label: string;
  desc: string;
}

export interface LandingFooterColumn {
  title: string;
  links: string[];
}

export interface LandingPageContent {
  hero: {
    imageUrl: string;
    imageAlt: string;
    tagline: string;
    title: string;
    titleAccent: string;
    meta: string;
    description: string;
  };
  theIdea: {
    sectionLabel: string;
    heading: string;
    headingEmphasis: string;
    paragraph1: string;
    paragraph2: string;
    tagline: string;
  };
  farmers: {
    number: string;
    title: string;
    titleAccent: string;
    paragraph1: string;
    paragraph2: string;
    bullets: string[];
    imageUrl: string;
    imageAlt: string;
    overlayLabel: string;
    overlayText: string;
  };
  verifiers: {
    number: string;
    title: string;
    titleAccent: string;
    paragraph1: string;
    paragraph2: string;
    bullets: string[];
    imageUrl: string;
    imageAlt: string;
    overlayLabel: string;
    overlayText: string;
  };
  marketplace: {
    sectionLabel: string;
    heading: string;
    headingEmphasis: string;
    paragraph: string;
    cards: LandingCard[];
  };
  traceability: {
    number: string;
    title: string;
    titleAccent: string;
    paragraph: string;
    bullets: string[];
    imageUrl: string;
    imageAlt: string;
  };
  technology: {
    sectionLabel: string;
    heading: string;
    headingEmphasis: string;
    paragraph: string;
    row1: LandingCard[];
    row2: LandingCard[];
  };
  metrics: {
    sectionLabel: string;
    items: LandingMetric[];
  };
  testimonials: LandingTestimonial[];
  cta: {
    imageUrl: string;
    label: string;
    heading: string;
    paragraph: string;
  };
  footer: {
    description: string;
    copyright: string;
    columns: LandingFooterColumn[];
  };
  nav: {
    links: string[];
    ctaText: string;
  };
}

const STORAGE_KEY = "cp_landing_page_content_v1";
export const LANDING_PAGE_ROW_ID = "main";

export const DEFAULT_LANDING_PAGE_CONTENT: LandingPageContent = {
  hero: {
    imageUrl:
      "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=2940&auto=format&fit=crop",
    imageAlt: "Lush agricultural landscape",
    tagline: "Digital Agricultural Infrastructure",
    title: "AgroChain",
    titleAccent: "360",
    meta: "Operating System for African Agriculture",
    description: "Agriculture, reimagined. From farm to shelf.",
  },
  theIdea: {
    sectionLabel: "01 // The Vision",
    heading: "Food should have a story ",
    headingEmphasis: "you can trust.",
    paragraph1:
      "For millions of farmers, access to reliable markets and financing remains uncertain. Buyers struggle to verify quality and origin. Consumers increasingly want to know where their food comes from.",
    paragraph2:
      "AgroChain 360 brings the entire agricultural journey onto a single digital platform, connecting production, verification, trade and traceability in one seamless system.",
    tagline: "Quietly powerful technology. Real-world impact.",
  },
  farmers: {
    number: "01",
    title: "Grow with ",
    titleAccent: "Confidence",
    paragraph1:
      "AgroChain 360 gives farmers something that has long been missing in agriculture: predictability. Farmers can secure production agreements before harvest and receive milestone-based payments that help pre-finance their growing cycle.",
    paragraph2:
      "Along the way, they gain access to AI-powered crop diagnostics, helping identify plant health issues early and improve yields.",
    bullets: ["More stability", "Better harvests", "Reliable markets"],
    imageUrl:
      "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "African farmer in field",
    overlayLabel: "AI Diagnostics",
    overlayText: "Health score 94/100. No issues detected",
  },
  verifiers: {
    number: "02",
    title: "Bring Trust ",
    titleAccent: "to the Field",
    paragraph1:
      "AgroChain 360 empowers agricultural extension officers and field verifiers with modern digital tools to record farm activity, verify production conditions and monitor crop health.",
    paragraph2:
      "Every inspection contributes to a trusted production record, and every completed verification can generate incentive payments, creating new opportunities for skilled agricultural professionals.",
    bullets: ["Better data", "Stronger supply chains", "Fair compensation"],
    imageUrl: "/officers.png",
    imageAlt: "Field verifiers inspecting crops",
    overlayLabel: "Verified",
    overlayText: "Evidence captured, AI analysis attached",
  },
  marketplace: {
    sectionLabel: "03 // Exchange",
    heading: "Where verified supply ",
    headingEmphasis: "meets real demand.",
    paragraph:
      "AgroChain 360's digital marketplace connects verified farmers directly with buyers, processors and aggregators seeking reliable agricultural supply. Transparent supply chains unlock stronger markets.",
    cards: [
      {
        id: "mp-1",
        idx: "01",
        icon: "ShoppingBag",
        title: "Direct Connection",
        desc: "Farmers connect directly with buyers: fewer middlemen, better margins, faster deals.",
      },
      {
        id: "mp-2",
        idx: "02",
        icon: "Shield",
        title: "Verified Origin",
        desc: "Every listing backed by verified farm activity and production evidence.",
      },
      {
        id: "mp-3",
        idx: "03",
        icon: "BarChart3",
        title: "Market Intelligence",
        desc: "Real-time pricing data and demand signals help farmers and buyers make smarter decisions.",
      },
    ],
  },
  traceability: {
    number: "03",
    title: "See Your Food ",
    titleAccent: "Differently",
    paragraph:
      "Every product processed through the AgroChain 360 network carries a simple QR code. Scan it and the story unfolds.",
    bullets: [
      "The farmer who grew it",
      "The farm where it was harvested",
      "The conditions it was grown under",
      "The journey from farm to shelf",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2069&auto=format&fit=crop",
    imageAlt: "Fresh market produce",
  },
  technology: {
    sectionLabel: "04 // Technology",
    heading: "Built for the Future ",
    headingEmphasis: "of Food Systems",
    paragraph:
      "AgroChain 360 combines modern web technology, artificial intelligence tools and secure digital records to create a transparent and scalable agricultural ecosystem.",
    row1: [
      { id: "t-1", idx: "01", icon: "Cpu", title: "AI Intelligence", desc: "Crop diagnostics and market analysis powered by advanced AI" },
      { id: "t-2", idx: "02", icon: "Shield", title: "Secure Records", desc: "Tamper-proof verification and immutable audit trails" },
      { id: "t-3", idx: "03", icon: "Scan", title: "QR Traceability", desc: "Instant product origin verification via simple scan" },
      { id: "t-4", idx: "04", icon: "Zap", title: "Real-time Payments", desc: "Automated milestone-based payment processing" },
    ],
    row2: [
      { id: "t-5", idx: "05", icon: "Globe", title: "Scalable Platform", desc: "Built to serve thousands of farms and supply chains" },
      { id: "t-6", idx: "06", icon: "Eye", title: "Full Visibility", desc: "Every step from planting to shelf, transparent" },
      { id: "t-7", idx: "07", icon: "Users", title: "Multi-role Access", desc: "Farmers, verifiers, buyers and admins: unified on one platform" },
      { id: "t-8", idx: "08", icon: "DollarSign", title: "Fair Economics", desc: "Direct connection eliminates unnecessary middlemen" },
    ],
  },
  metrics: {
    sectionLabel: "Global Impact Matrix",
    items: [
      {
        id: "m-1",
        value: "500+",
        label: "Connected Farmers",
        desc: "Smallholder farmers onboarded across Zambia with verified production records and digital contracts.",
      },
      {
        id: "m-2",
        value: "K2.5M",
        label: "Value Facilitated",
        desc: "Total transaction value processed through the platform's milestone-based payment system.",
      },
      {
        id: "m-3",
        value: "100%",
        label: "Traceable Supply",
        desc: "Every product processed through AgroChain 360 carries complete farm-to-shelf provenance data.",
      },
    ],
  },
  testimonials: [
    {
      id: "test-1",
      name: "John Mwale",
      role: "Mango Farmer, Lusaka",
      quote: "AgroChain 360 changed my life. I now get paid on time and can plan for my family's future with confidence.",
    },
    {
      id: "test-2",
      name: "Mary Banda",
      role: "Pineapple Farmer, Ndola",
      quote: "The transparency is amazing. I can see exactly when my payments will arrive. No more uncertainty.",
    },
    {
      id: "test-3",
      name: "Peter Phiri",
      role: "Tomato Farmer, Kitwe",
      quote: "Best decision I ever made. My income has doubled since joining AgroChain 360. It's a game-changer.",
    },
  ],
  cta: {
    imageUrl:
      "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?q=80&w=2832&auto=format&fit=crop",
    label: "The Next Era",
    heading: "Cultivate the Future.",
    paragraph:
      "Whether you grow, verify, buy or consume, AgroChain 360 connects you to a more transparent agricultural future.",
  },
  footer: {
    description:
      "A new digital infrastructure for transparent, intelligent agricultural supply chains.",
    copyright: "© 2026 AgroChain 360. All rights reserved.",
    columns: [
      { title: "Platform", links: ["Farmers", "Verifiers", "Marketplace", "Traceability"] },
      { title: "Company", links: ["About", "Blog", "Careers", "Press"] },
      { title: "Support", links: ["Help Center", "Contact", "FAQ", "Status"] },
    ],
  },
  nav: {
    links: ["The Idea", "Farmers", "Marketplace", "Traceability"],
    ctaText: "Join Network",
  },
};

function deepMerge<T>(defaults: T, saved: Partial<T>): T {
  const result = { ...defaults } as T;
  for (const key of Object.keys(saved) as (keyof T)[]) {
    const val = saved[key];
    if (val === undefined || val === null) continue;
    if (Array.isArray(val)) {
      (result as Record<string, unknown>)[key as string] = val;
    } else if (typeof val === "object") {
      (result as Record<string, unknown>)[key as string] = deepMerge(
        (defaults as Record<string, unknown>)[key as string] as T[keyof T],
        val as Partial<T[keyof T]>
      );
    } else {
      (result as Record<string, unknown>)[key as string] = val;
    }
  }
  return result;
}

function readLocalStorage(): LandingPageContent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return deepMerge(DEFAULT_LANDING_PAGE_CONTENT, JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeLocalStorage(content: LandingPageContent) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
}

export async function loadLandingPageContent(): Promise<LandingPageContent> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("landing_page_content")
        .select("content")
        .eq("id", LANDING_PAGE_ROW_ID)
        .maybeSingle();

      if (!error && data?.content) {
        const merged = deepMerge(DEFAULT_LANDING_PAGE_CONTENT, data.content as Partial<LandingPageContent>);
        writeLocalStorage(merged);
        return merged;
      }
    } catch (e) {
      console.warn("Failed to load landing page from Supabase:", e);
    }
  }

  return readLocalStorage() ?? DEFAULT_LANDING_PAGE_CONTENT;
}

export async function saveLandingPageContent(
  content: LandingPageContent,
  updatedBy?: string
): Promise<{ ok: boolean; error?: string }> {
  writeLocalStorage(content);

  if (!supabase) {
    return { ok: true };
  }

  try {
    const payload = {
      id: LANDING_PAGE_ROW_ID,
      content,
      updated_by: updatedBy ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("landing_page_content").upsert(payload, { onConflict: "id" });
    if (error) {
      console.error("Supabase save failed:", error);
      return { ok: true, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save failed";
    return { ok: true, error: msg };
  }
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
