import { NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/geocoding';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { readStoredCoordinates } from '@/lib/farmerMapUtils';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST() {
  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 503 });
  }

  const { data: farmers, error } = await db
    .from('farmers')
    .select('id, name, location_address, location_lat, location_lng, gps_lat, gps_lng')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const farmer of farmers ?? []) {
    if (readStoredCoordinates(farmer as Record<string, unknown>)) {
      skipped += 1;
      continue;
    }

    const address = String(farmer.location_address || '').trim();
    if (!address) {
      skipped += 1;
      continue;
    }

    const geo = await geocodeAddress(address);
    await wait(1100);

    if (!geo) {
      failed += 1;
      continue;
    }

    const { error: updateError } = await db
      .from('farmers')
      .update({
        location_address: geo.displayName,
        location_lat: geo.lat,
        location_lng: geo.lng,
        gps_lat: geo.lat,
        gps_lng: geo.lng,
      })
      .eq('id', farmer.id);

    if (updateError) {
      failed += 1;
      continue;
    }

    updated += 1;
  }

  return NextResponse.json({
    success: true,
    total: farmers?.length ?? 0,
    updated,
    skipped,
    failed,
  });
}
