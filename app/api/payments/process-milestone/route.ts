import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { releaseFundsFromEscrow } from '@/lib/cdpEscrow';

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

    console.log(`Processing milestone payment: ${amount} USDC to ${farmerWalletAddress}`);

    // Call Escrow Service to execute the Server Wallet sending USDC to farmer
    const { success, transactionHash } = await releaseFundsFromEscrow(
      farmerWalletAddress,
      amount,
      contractId,
      milestoneId
    );

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Milestone payment released successfully via CDP Server Wallet',
        milestoneId,
        amount,
        transactionHash
      });
    } else {
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
