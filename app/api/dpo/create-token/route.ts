import { NextRequest, NextResponse } from 'next/server';
import { createDpoToken, dpoPaymentUrl, isDpoConfigured } from '@/lib/dpo/service';

export async function POST(request: NextRequest) {
  if (!isDpoConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Card payments are not configured. Please contact support.' },
      { status: 503 },
    );
  }

  const body = await request.json();
  const reference = String(body.reference || '').trim();
  const amount = Number(body.amount);

  if (!reference || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { success: false, error: 'Invalid payment reference or amount.' },
      { status: 400 },
    );
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, '');

  const result = await createDpoToken({
    reference,
    amount,
    firstName: body.firstName ? String(body.firstName) : undefined,
    lastName: body.lastName ? String(body.lastName) : undefined,
    email: body.email ? String(body.email) : undefined,
    phone: body.phone ? String(body.phone) : undefined,
    description: body.description ? String(body.description) : `AgroChain marketplace ${reference}`,
    redirectUrl: `${appUrl}/marketplace/dpo-callback?ref=${encodeURIComponent(reference)}`,
    backUrl: `${appUrl}/marketplace/dpo-callback?cancelled=1&ref=${encodeURIComponent(reference)}`,
  });

  if (!result.success || !result.transToken) {
    return NextResponse.json(
      {
        success: false,
        error: result.error || result.explanation || 'Could not start card payment.',
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    reference,
    transToken: result.transToken,
    paymentUrl: dpoPaymentUrl(result.transToken),
  });
}
