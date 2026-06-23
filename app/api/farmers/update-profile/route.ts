import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const WALLET_RE = /^0x[a-fA-F0-9]{40}$/;

const ALLOWED_FIELDS = new Set([
  'name',
  'email',
  'phone',
  'location_lat',
  'location_lng',
  'location_address',
  'farm_size',
  'farm_size_hectares',
  'gps_lat',
  'gps_lng',
  'nrc_id',
  'gender',
  'profile_photo',
  'bio',
]);

function normalizeNullable(value: unknown): unknown {
  if (value === '' || value === undefined) return null;
  return value;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const farmerId = String(body.farmerId || '').trim();
    const walletAddress = String(body.walletAddress || '').trim();

    if (!farmerId || !WALLET_RE.test(walletAddress)) {
      return NextResponse.json({ error: 'Invalid farmer or wallet address.' }, { status: 400 });
    }

    const db = getSupabaseAdmin();
    if (!db) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 503 });
    }

    const { data: existing, error: fetchError } = await db
      .from('farmers')
      .select('id, wallet_address')
      .eq('id', farmerId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Farmer profile not found.' }, { status: 404 });
    }

    if (existing.wallet_address?.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json({ error: 'Wallet does not match this farmer profile.' }, { status: 403 });
    }

    const rawUpdates = (body.updates || {}) as Record<string, unknown>;
    const updates: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(rawUpdates)) {
      if (!ALLOWED_FIELDS.has(key)) continue;
      updates[key] = normalizeNullable(value);
    }

    if (updates.location_lat != null || updates.location_lng != null) {
      const lat = Number(updates.location_lat ?? rawUpdates.location_lat);
      const lng = Number(updates.location_lng ?? rawUpdates.location_lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        updates.location_lat = lat;
        updates.location_lng = lng;
        updates.gps_lat = lat;
        updates.gps_lng = lng;
      }
    }

    if (updates.farm_size != null) {
      const size = Number(updates.farm_size);
      updates.farm_size = Number.isFinite(size) ? size : 0;
      updates.farm_size_hectares = updates.farm_size;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
    }

    const { data: farmer, error: updateError } = await db
      .from('farmers')
      .update(updates)
      .eq('id', farmerId)
      .select()
      .single();

    if (updateError) {
      console.error('Farmer profile update failed:', updateError);
      return NextResponse.json(
        { error: updateError.message || 'Failed to update profile.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, farmer });
  } catch (error) {
    console.error('Farmer profile update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update profile.' },
      { status: 500 },
    );
  }
}
