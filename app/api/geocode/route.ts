import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/geocoding';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim();
  if (!query) {
    return NextResponse.json({ error: 'Missing search query.' }, { status: 400 });
  }

  try {
    const result = await geocodeAddress(query);
    if (!result) {
      return NextResponse.json({ error: 'Location not found.' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Geocode error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Geocoding failed.' },
      { status: 500 },
    );
  }
}
