import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { releaseFundsFromEscrow } from '@/lib/cdpEscrow';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const ProcessMilestoneSchema = z.object({
  contractId: z.string().min(1, "Contract ID is required"),
  milestoneId: z.string().min(1, "Milestone ID is required"),
  officerId: z.string().optional(),
  amount: z.number().positive("Amount must be a positive number"),
  farmerWalletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid farmer wallet address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate inputs
    const parsedData = ProcessMilestoneSchema.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsedData.error.format() },
        { status: 400 }
      );
    }

    const { contractId, milestoneId, amount, farmerWalletAddress } = parsedData.data;

    // ── Server-side authorization: never trust the client-supplied amount or
    // wallet. Re-validate everything against the database before releasing funds. ──
    const db = getSupabaseAdmin();
    if (!db) {
      return NextResponse.json(
        { error: 'Payment service not configured' },
        { status: 503 }
      );
    }

    const { data: milestone, error: mErr } = await db
      .from('milestones')
      .select('id, contract_id, status, payment_status, payment_amount')
      .eq('id', milestoneId)
      .single();

    if (mErr || !milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // Milestone must belong to the stated contract.
    if (String(milestone.contract_id) !== String(contractId)) {
      return NextResponse.json({ error: 'Milestone does not belong to contract' }, { status: 400 });
    }

    // Only verified (officer-approved) milestones can be paid.
    if (milestone.status !== 'verified') {
      return NextResponse.json(
        { error: `Milestone is not approved for payment (status: ${milestone.status})` },
        { status: 409 }
      );
    }

    // Idempotency / double-spend guard: refuse if already paid or in flight.
    if (milestone.payment_status === 'completed' || milestone.payment_status === 'processing') {
      return NextResponse.json(
        { error: `Milestone payment already ${milestone.payment_status}` },
        { status: 409 }
      );
    }

    // The amount must match the milestone's recorded payment amount (1 cent tolerance).
    if (typeof milestone.payment_amount === 'number' && Math.abs(milestone.payment_amount - amount) > 0.01) {
      return NextResponse.json(
        { error: 'Amount does not match the milestone payment amount' },
        { status: 400 }
      );
    }

    // The destination wallet must match the contract's farmer wallet.
    const { data: contract, error: cErr } = await db
      .from('contracts')
      .select('id, farmer_id')
      .eq('id', contractId)
      .single();

    if (cErr || !contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const { data: farmer } = await db
      .from('farmers')
      .select('wallet_address')
      .eq('id', contract.farmer_id)
      .single();

    if (!farmer?.wallet_address || farmer.wallet_address.toLowerCase() !== farmerWalletAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Destination wallet does not match the contract farmer' },
        { status: 403 }
      );
    }

    // Claim the milestone so concurrent requests cannot double-release.
    const { data: claimed, error: claimErr } = await db
      .from('milestones')
      .update({ payment_status: 'processing' })
      .eq('id', milestoneId)
      .eq('payment_status', milestone.payment_status)
      .select('id');

    if (claimErr || !claimed || claimed.length === 0) {
      return NextResponse.json(
        { error: 'Milestone payment already in progress' },
        { status: 409 }
      );
    }

    console.log(`Processing milestone payment: ${amount} USDC to ${farmerWalletAddress}`);

    let success = false;
    let transactionHash: string | undefined;
    try {
      // Call Escrow Service to execute the Server Wallet sending USDC to farmer
      ({ success, transactionHash } = await releaseFundsFromEscrow(
        farmerWalletAddress,
        amount,
        contractId,
        milestoneId
      ));
    } catch (releaseErr) {
      // Roll the claim back so the payment can be retried.
      await db.from('milestones').update({ payment_status: 'pending' }).eq('id', milestoneId);
      throw releaseErr;
    }

    if (success) {
      // Finalize: mark the milestone as paid so it cannot be released again.
      await db
        .from('milestones')
        .update({
          payment_status: 'completed',
          status: 'paid',
          payment_tx: transactionHash,
        })
        .eq('id', milestoneId);

      return NextResponse.json({
        success: true,
        message: 'Milestone payment released successfully via CDP Server Wallet',
        milestoneId,
        amount,
        transactionHash
      });
    } else {
      await db.from('milestones').update({ payment_status: 'pending' }).eq('id', milestoneId);
      throw new Error('Transaction failed unexpectedly during execution');
    }

  } catch (error: any) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Payment processing failed' },
      { status: 500 }
    );
  }
}
