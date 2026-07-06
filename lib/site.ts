/** Canonical public site URL for QR codes, share links, and NFT metadata. */
export const PUBLIC_SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || 'https://agrochain360.com'
).replace(/\/$/, '');

export function getCanonicalHost(): string {
  return new URL(PUBLIC_SITE_URL).hostname;
}

/** www and apex are both valid - only redirect explicit legacy hosts (Vercel URLs). */
export function isProductionHost(host: string, canonicalHost: string): boolean {
  if (host === canonicalHost) return true;
  const bare = canonicalHost.replace(/^www\./, '');
  return host === bare || host === `www.${bare}`;
}

/** Hostnames that should 308-redirect to PUBLIC_SITE_URL (old QR / printed links). */
export const LEGACY_REDIRECT_HOSTS = (
  process.env.LEGACY_REDIRECT_HOSTS ||
  [
    'cherry-pi.vercel.app',
    'cherry-pick.vercel.app',
    'agrochain360.vercel.app',
  ].join(',')
)
  .split(',')
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

export function publicLookupUrl(): string {
  return `${PUBLIC_SITE_URL}/lookup`;
}

export function publicTraceUrl(code: string): string {
  return `${PUBLIC_SITE_URL}/trace/${encodeURIComponent(code)}`;
}

/** Map legacy paths (e.g. /lookup?batch=CODE) to the current route. */
export function resolveLegacyPublicPath(pathname: string, searchParams: URLSearchParams): string {
  if (pathname === '/lookup') {
    const batch = searchParams.get('batch')?.trim();
    if (batch) {
      return `/trace/${encodeURIComponent(batch.toUpperCase())}`;
    }
  }
  return pathname;
}
