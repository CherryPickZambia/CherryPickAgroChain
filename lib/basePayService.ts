/**
 * Base Pay Integration Service
 * Handles payments using Coinbase Base Pay
 */

import { createPublicClient, createWalletClient, custom, parseEther, http } from 'viem';
import { base } from 'viem/chains';

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface PaymentRequest {
  to: string; // Recipient wallet address
  amount: number; // Amount in ZMW
  orderId: string;
  cropType: string;
  quantity: number;
}

export interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

/**
 * Send payment using Base Pay
 * This uses the user's connected wallet to send payment to the farmer
 */
export async function sendPayment(
  request: PaymentRequest
): Promise<PaymentResult> {
  try {
    // Check if window.ethereum is available
    if (typeof window === 'undefined' || !window.ethereum) {
      return {
        success: false,
        error: 'No wallet detected. Please connect your wallet.',
      };
    }

    // Create wallet client
    const walletClient = createWalletClient({
      chain: base,
      transport: custom(window.ethereum),
    });

    // Get the user's address
    const [address] = await walletClient.getAddresses();

    if (!address) {
      return {
        success: false,
        error: 'No wallet address found',
      };
    }

    // Convert ZMW to ETH (simplified - in production, use oracle for conversion)
    // For demo: 1 ZMW ≈ 0.00005 ETH
    const ethAmount = (request.amount * 0.00005).toString();

    // Send transaction
    const hash = await walletClient.sendTransaction({
      account: address,
      to: request.to as `0x${string}`,
      value: parseEther(ethAmount),
      chain: base,
    });

    return {
      success: true,
      transactionHash: hash,
    };
  } catch (error: any) {
    console.error('Payment error:', error);
    return {
      success: false,
      error: error.message || 'Payment failed',
    };
  }
}

/**
 * Verify payment transaction on blockchain
 */
export async function verifyPayment(
  transactionHash: string
): Promise<boolean> {
  try {
    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    });

    const receipt = await publicClient.getTransactionReceipt({
      hash: transactionHash as `0x${string}`,
    });

    return receipt.status === 'success';
  } catch (error) {
    console.error('Verification error:', error);
    return false;
  }
}

/**
 * Get payment status
 */
export async function getPaymentStatus(
  transactionHash: string
): Promise<'pending' | 'success' | 'failed'> {
  try {
    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    });

    const receipt = await publicClient.getTransactionReceipt({
      hash: transactionHash as `0x${string}`,
    });

    if (!receipt) {
      return 'pending';
    }

    return receipt.status === 'success' ? 'success' : 'failed';
  } catch (error) {
    console.error('Status check error:', error);
    return 'failed';
  }
}

/**
 * Format transaction hash for display
 */
export function formatTxHash(hash: string): string {
  if (!hash) return '';
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

/**
 * Get block explorer URL for transaction
 */
export function getExplorerUrl(transactionHash: string): string {
  return `https://basescan.org/tx/${transactionHash}`;
}

/**
 * Estimate gas for payment
 */
export async function estimatePaymentGas(
  to: string,
  amount: number
): Promise<bigint | null> {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      return null;
    }

    const publicClient = createPublicClient({
      chain: base,
      transport: custom(window.ethereum),
    });

    const walletClient = createWalletClient({
      chain: base,
      transport: custom(window.ethereum),
    });

    const [address] = await walletClient.getAddresses();

    if (!address) {
      return null;
    }

    const ethAmount = (amount * 0.00005).toString();

    const gas = await publicClient.estimateGas({
      account: address,
      to: to as `0x${string}`,
      value: parseEther(ethAmount),
    });

    return gas;
  } catch (error) {
    console.error('Gas estimation error:', error);
    return null;
  }
}
