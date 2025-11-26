/**
 * Base Pay Integration Service
 * Handles USDC payments on Base Network
 */

import { createPublicClient, createWalletClient, custom, parseUnits, http, encodeFunctionData } from 'viem';
import { base } from 'viem/chains';

// USDC Contract on Base Mainnet
const USDC_CONTRACT_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

// USDC ABI (only transfer function needed)
const USDC_ABI = [
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'decimals',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }]
  }
] as const;

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface PaymentRequest {
  to: string; // Recipient wallet address
  amount: number; // Amount in USDC
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
 * Get USDC balance for an address
 */
export async function getUSDCBalance(address: string): Promise<string> {
  try {
    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    });

    const balance = await publicClient.readContract({
      address: USDC_CONTRACT_ADDRESS,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });

    // USDC has 6 decimals
    return (Number(balance) / 1_000_000).toFixed(2);
  } catch (error) {
    console.error('Error getting USDC balance:', error);
    return '0.00';
  }
}

/**
 * Send USDC payment on Base Network
 * This uses the user's connected wallet to send USDC to the farmer
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

    // Convert amount to USDC units (6 decimals)
    // Amount is already in USD/USDC
    const usdcAmount = parseUnits(request.amount.toString(), 6);

    // Encode the transfer function call
    const data = encodeFunctionData({
      abi: USDC_ABI,
      functionName: 'transfer',
      args: [request.to as `0x${string}`, usdcAmount],
    });

    // Send USDC transfer transaction
    const hash = await walletClient.sendTransaction({
      account: address,
      to: USDC_CONTRACT_ADDRESS,
      data: data,
      chain: base,
    });

    return {
      success: true,
      transactionHash: hash,
    };
  } catch (error: any) {
    console.error('Payment error:', error);
    
    // Provide user-friendly error messages
    let errorMessage = 'Payment failed';
    if (error.message?.includes('insufficient funds')) {
      errorMessage = 'Insufficient USDC balance';
    } else if (error.message?.includes('user rejected')) {
      errorMessage = 'Transaction was rejected';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
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
 * Estimate gas for USDC payment
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

    // Convert amount to USDC units (6 decimals)
    const usdcAmount = parseUnits(amount.toString(), 6);

    // Encode the transfer function call
    const data = encodeFunctionData({
      abi: USDC_ABI,
      functionName: 'transfer',
      args: [to as `0x${string}`, usdcAmount],
    });

    const gas = await publicClient.estimateGas({
      account: address,
      to: USDC_CONTRACT_ADDRESS,
      data: data,
    });

    return gas;
  } catch (error) {
    console.error('Gas estimation error:', error);
    return null;
  }
}
