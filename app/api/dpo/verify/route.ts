import { NextRequest, NextResponse } from 'next/server';
import {
  isDpoFailedResult,
  isDpoPendingResult,
  verifyDpoToken,
} from '@/lib/dpo/service';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const transToken = String(body.transToken || '').trim();

  if (!transToken) {
    return NextResponse.json({ success: false, error: 'Missing transaction token.' }, { status: 400 });
  }

  const verify = await verifyDpoToken(transToken);

  if (!verify.success) {
    return NextResponse.json(
      { success: false, error: verify.error || 'Verification failed.' },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    paid: verify.paid,
    pending: isDpoPendingResult(verify.result),
    failed: isDpoFailedResult(verify.result),
    result: verify.result,
    explanation: verify.explanation,
  });
}
