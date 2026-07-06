import { hasValidCoordinates } from '@/lib/geocoding';

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
}

/** Slightly offset markers that share the same coordinates so each farmer is visible. */
export function spreadOverlappingMarkers<T extends MapPoint>(points: T[]): T[] {
  const groups = new Map<string, T[]>();

  for (const point of points) {
    const key = `${point.lat.toFixed(5)}:${point.lng.toFixed(5)}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(point);
    groups.set(key, bucket);
  }

  const spread: T[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      spread.push(group[0]);
      continue;
    }
    group.forEach((point, index) => {
      const angle = (2 * Math.PI * index) / group.length;
      const radius = 0.012;
      spread.push({
        ...point,
        lat: point.lat + radius * Math.cos(angle),
        lng: point.lng + radius * Math.sin(angle),
      });
    });
  }

  return spread;
}

export function readStoredCoordinates(record: Record<string, unknown>): { lat: number; lng: number } | null {
  const lat = Number(record.location_lat ?? record.gps_lat);
  const lng = Number(record.location_lng ?? record.gps_lng);
  if (hasValidCoordinates(lat, lng)) {
    return { lat, lng };
  }
  return null;
}

export function hasPlottableLocation(
  lat: unknown,
  lng: unknown,
  address?: string | null,
): boolean {
  if (hasValidCoordinates(lat, lng)) return true;
  const text = address?.trim();
  return Boolean(text && text !== 'Unknown Location');
}

export interface FarmMapEntry {
  id: string;
  name: string;
  farmer: string;
  phone: string;
  location: string;
  lat: number;
  lng: number;
  crops: string[];
  hectares: number;
  status: 'active' | 'pending';
  color: string;
}

export function buildFarmMapEntries(
  farmers: Array<{
    id: string;
    name: string;
    phone: string;
    location: string;
    locationLat: number;
    locationLng: number;
    crops: string[];
    farmSize: number;
    verified: boolean;
  }>,
  colors: { active: string; pending: string } = { active: '#BFFF00', pending: '#f59e0b' },
): FarmMapEntry[] {
  const withCoords = farmers
    .filter((farmer) => hasValidCoordinates(farmer.locationLat, farmer.locationLng))
    .map((farmer) => ({
      id: farmer.id,
      name: `${farmer.name}'s Farm`,
      farmer: farmer.name,
      phone: farmer.phone || '-',
      location: farmer.location || 'Zambia',
      lat: farmer.locationLat,
      lng: farmer.locationLng,
      crops: farmer.crops || [],
      hectares: farmer.farmSize || 0,
      status: (farmer.verified ? 'active' : 'pending') as 'active' | 'pending',
      color: farmer.verified ? colors.active : colors.pending,
    }));

  return spreadOverlappingMarkers(withCoords);
}
