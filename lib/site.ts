/** Canonical public site URL for QR codes, share links, and NFT metadata. */
export const PUBLIC_SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || 'https://agrochain360.com'
).replace(/\/$/, '');

export function publicLookupUrl(): string {
  return `${PUBLIC_SITE_URL}/lookup`;
}

export function publicTraceUrl(code: string): string {
  return `${PUBLIC_SITE_URL}/trace/${encodeURIComponent(code)}`;
}
