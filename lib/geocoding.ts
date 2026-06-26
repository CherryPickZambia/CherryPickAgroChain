export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

/** Forward-geocode a place name (appends Zambia when missing). */
export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const searchQuery = /zambia/i.test(trimmed) ? trimmed : `${trimmed}, Zambia`;
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'json');
  url.searchParams.set('q', searchQuery);
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'zm');

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
      'User-Agent': 'AgroChain360/1.0 (https://agrochain360.com)',
    },
  });

  if (!response.ok) return null;

  const results = await response.json();
  const hit = results?.[0];
  if (!hit?.lat || !hit?.lon) return null;

  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    lat,
    lng,
    displayName: hit.display_name || trimmed,
  };
}

export function hasValidCoordinates(lat: unknown, lng: unknown): boolean {
  const la = Number(lat);
  const ln = Number(lng);
  return Number.isFinite(la) && Number.isFinite(ln) && la !== 0 && ln !== 0;
}
