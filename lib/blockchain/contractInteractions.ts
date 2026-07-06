/**
 * Smart Contract Interaction Layer
 * Provides functions to interact with AgroChain360 smart contracts
 */

import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { getContractAddress, CURRENT_NETWORK } from './contractConfig';
import { AgroChain360ManagerABI } from './abis/AgroChain360Manager';
import { CropJourneyNFTABI } from './abis/CropJourneyNFT';

const chain = CURRENT_NETWORK === 'base' ? base : baseSepolia;

/**
 * Create a public client for reading contract data
 */
export const publicClient = createPublicClient({
  chain,
  transport: http(),
});

/**
 * Contract Interaction Functions
 */

export interface CreateContractParams {
  farmer: `0x${string}`;
  cropType: string;
  variety: string;
  requiredQuantity: number;
  pricePerKg: number;
  harvestDeadline: number;
  ipfsMetadata: string;
  totalValue: bigint;
}

export interface MilestoneParams {
  names: string[];
  descriptions: string[];
  paymentPercentages: number[];
  expectedDates: number[];
}

/**
 * Create a new farming contract
 */
export async function createFarmingContract(
  walletClient: any,
  params: CreateContractParams
) {
  const contractAddress = getContractAddress('AgroChain360Manager') as `0x${string}`;
  
  const { request } = await publicClient.simulateContract({
    address: contractAddress,
    abi: AgroChain360ManagerABI,
    functionName: 'createContract',
    args: [
      params.farmer,
      params.cropType,
      params.variety,
      BigInt(params.requiredQuantity),
      parseEther(params.pricePerKg.toString()),
      BigInt(params.harvestDeadline),
      params.ipfsMetadata,
    ],
    value: params.totalValue,
    account: walletClient.account,
  });

  const hash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  return {
    transactionHash: hash,
    receipt,
  };
}

/**
 * Add milestones to a contract
 */
export async function addContractMilestones(
  walletClient: any,
  contractId: number,
  milestones: MilestoneParams
) {
  const contractAddress = getContractAddress('AgroChain360Manager') as `0x${string}`;
  
  const { request } = await publicClient.simulateContract({
    address: contractAddress,
    abi: AgroChain360ManagerABI,
    functionName: 'addMilestones',
    args: [
      BigInt(contractId),
      milestones.names,
      milestones.descriptions,
      milestones.paymentPercentages.map(p => BigInt(p)),
      milestones.expectedDates.map(d => BigInt(d)),
    ],
    account: walletClient.account,
  });

  const hash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  return {
    transactionHash: hash,
    receipt,
  };
}

/**
 * Submit milestone evidence
 */
export async function submitMilestoneEvidence(
  walletClient: any,
  contractId: number,
  milestoneId: number,
  evidenceIPFS: string
) {
  const contractAddress = getContractAddress('AgroChain360Manager') as `0x${string}`;
  
  const { request } = await publicClient.simulateContract({
    address: contractAddress,
    abi: AgroChain360ManagerABI,
    functionName: 'submitMilestoneEvidence',
    args: [BigInt(contractId), BigInt(milestoneId), evidenceIPFS],
    account: walletClient.account,
  });

  const hash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  return {
    transactionHash: hash,
    receipt,
  };
}

/**
 * Verify a milestone (Extension Officer)
 */
export async function verifyMilestone(
  walletClient: any,
  contractId: number,
  milestoneId: number,
  approved: boolean,
  evidenceIPFS: string
) {
  const contractAddress = getContractAddress('AgroChain360Manager') as `0x${string}`;
  
  const { request } = await publicClient.simulateContract({
    address: contractAddress,
    abi: AgroChain360ManagerABI,
    functionName: 'verifyMilestone',
    args: [BigInt(contractId), BigInt(milestoneId), approved, evidenceIPFS],
    account: walletClient.account,
  });

  const hash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  return {
    transactionHash: hash,
    receipt,
  };
}

/**
 * Get contract details
 */
export async function getContract(contractId: number) {
  const contractAddress = getContractAddress('AgroChain360Manager') as `0x${string}`;
  
  const contract = await publicClient.readContract({
    address: contractAddress,
    abi: AgroChain360ManagerABI,
    functionName: 'getContract',
    args: [BigInt(contractId)],
  });

  return contract;
}

/**
 * Get contract milestones
 */
export async function getContractMilestones(contractId: number) {
  const contractAddress = getContractAddress('AgroChain360Manager') as `0x${string}`;
  
  const milestones = await publicClient.readContract({
    address: contractAddress,
    abi: AgroChain360ManagerABI,
    functionName: 'getContractMilestones',
    args: [BigInt(contractId)],
  });

  return milestones;
}

/**
 * Get farmer's contracts
 */
export async function getFarmerContracts(farmerAddress: `0x${string}`) {
  const contractAddress = getContractAddress('AgroChain360Manager') as `0x${string}`;
  
  const contracts = await publicClient.readContract({
    address: contractAddress,
    abi: AgroChain360ManagerABI,
    functionName: 'getFarmerContracts',
    args: [farmerAddress],
  });

  return contracts;
}

/**
 * NFT Functions
 */

/**
 * Mint a new crop batch NFT
 */
export async function mintCropBatchNFT(
  walletClient: any,
  params: {
    contractId: number;
    farmer: `0x${string}`;
    cropType: string;
    variety: string;
    quantity: number;
    farmLocation: string;
    qrCode: string;
    isOrganic: boolean;
    certifications: string;
    metadataURI: string;
  }
) {
  const contractAddress = getContractAddress('CropJourneyNFT') as `0x${string}`;
  
  const { request } = await publicClient.simulateContract({
    address: contractAddress,
    abi: CropJourneyNFTABI,
    functionName: 'mintCropBatch',
    args: [
      BigInt(params.contractId),
      params.farmer,
      params.cropType,
      params.variety,
      BigInt(params.quantity),
      params.farmLocation,
      params.qrCode,
      params.isOrganic,
      params.certifications,
      params.metadataURI,
    ],
    account: walletClient.account,
  });

  const hash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  return {
    transactionHash: hash,
    receipt,
  };
}

/**
 * Record journey stage
 */
export async function recordJourneyStage(
  walletClient: any,
  tokenId: number,
  stage: number,
  location: string,
  notes: string,
  evidenceIPFS: string,
  temperature: string,
  humidity: string
) {
  const contractAddress = getContractAddress('CropJourneyNFT') as `0x${string}`;
  
  const { request } = await publicClient.simulateContract({
    address: contractAddress,
    abi: CropJourneyNFTABI,
    functionName: 'recordJourneyStage',
    args: [
      BigInt(tokenId),
      stage,
      location,
      notes,
      evidenceIPFS,
      temperature,
      humidity,
    ],
    account: walletClient.account,
  });

  const hash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  return {
    transactionHash: hash,
    receipt,
  };
}

/**
 * Get crop batch by QR code
 */
export async function getCropBatchByQR(qrCode: string) {
  const contractAddress = getContractAddress('CropJourneyNFT') as `0x${string}`;
  
  const batch = await publicClient.readContract({
    address: contractAddress,
    abi: CropJourneyNFTABI,
    functionName: 'getCropBatchByQR',
    args: [qrCode],
  });

  return batch;
}

/**
 * Get journey history
 */
export async function getJourneyHistory(tokenId: number) {
  const contractAddress = getContractAddress('CropJourneyNFT') as `0x${string}`;
  
  const history = await publicClient.readContract({
    address: contractAddress,
    abi: CropJourneyNFTABI,
    functionName: 'getJourneyHistory',
    args: [BigInt(tokenId)],
  });

  return history;
}

/**
 * Utility Functions
 */

/**
 * Format wei to ETH
 */
export function formatWeiToEth(wei: bigint): string {
  return formatEther(wei);
}

/**
 * Parse ETH to wei
 */
export function parseEthToWei(eth: string): bigint {
  return parseEther(eth);
}

/**
 * Get transaction receipt
 */
export async function getTransactionReceipt(hash: `0x${string}`) {
  return await publicClient.waitForTransactionReceipt({ hash });
}

/**
 * Watch contract events
 */
export function watchContractEvents(
  contractName: 'AgroChain360Manager' | 'CropJourneyNFT',
  eventName: string,
  callback: (logs: any[]) => void
) {
  const contractAddress = getContractAddress(contractName) as `0x${string}`;
  const abi = contractName === 'AgroChain360Manager' ? AgroChain360ManagerABI : CropJourneyNFTABI;
  
  return publicClient.watchContractEvent({
    address: contractAddress,
    abi,
    eventName: eventName as any,
    onLogs: callback,
  });
}

/**
 * USDC Payment Functions
 * For paying farmers and verifiers when milestones are approved
 */

// USDC contract address on Base
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const; // Base mainnet USDC
const USDC_DECIMALS = 6;

// Standard ERC20 ABI for USDC transfers
const USDC_ABI = [
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  }
] as const;

/**
 * Get USDC balance for an address
 */
export async function getUSDCBalance(address: `0x${string}`): Promise<number> {
  try {
    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [address],
    });
    
    // Convert from 6 decimals to human readable
    return Number(balance) / Math.pow(10, USDC_DECIMALS);
  } catch (error) {
    console.error('Error getting USDC balance:', error);
    return 0;
  }
}

/**
 * Transfer USDC to a recipient
 */
export async function transferUSDC(
  walletClient: any,
  to: `0x${string}`,
  amount: number
): Promise<{ transactionHash: string; success: boolean }> {
  try {
    // Convert amount to USDC decimals (6)
    const amountInDecimals = BigInt(Math.floor(amount * Math.pow(10, USDC_DECIMALS)));
    
    const { request } = await publicClient.simulateContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'transfer',
      args: [to, amountInDecimals],
      account: walletClient.account,
    });

    const hash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash });
    
    return { transactionHash: hash, success: true };
  } catch (error: any) {
    console.error('USDC transfer failed:', error);
    throw new Error(`USDC transfer failed: ${error.message}`);
  }
}

/**
 * Verifier (Officer) Fee Configuration
 * Tiered model in ZMW:
 *   - Milestone payment ≤ K2,000  → officer earns 5% of the milestone
 *   - Milestone payment > K2,000  → officer earns flat K150 (cap)
 * Admin can override the entire calculation with `customFeePercent`.
 */
export interface VerifierFeeConfig {
  totalContractValue: number;      // Total contract value (ZMW)
  totalMilestones: number;         // Number of milestones in contract
  customFeePercent?: number;       // Admin-set custom fee percentage (optional)
}

export const VERIFIER_FEE_TIER_THRESHOLD = 2000; // K2,000
export const VERIFIER_FEE_PERCENT_BELOW = 5;     // 5%
export const VERIFIER_FEE_FLAT_ABOVE = 150;      // K150 flat

/**
 * Compute the fee a verifier earns for approving a single milestone.
 * Pure helper - no side-effects.
 */
export function feeForMilestone(milestoneAmount: number): number {
  if (!Number.isFinite(milestoneAmount) || milestoneAmount <= 0) return 0;
  if (milestoneAmount <= VERIFIER_FEE_TIER_THRESHOLD) {
    return milestoneAmount * (VERIFIER_FEE_PERCENT_BELOW / 100);
  }
  return VERIFIER_FEE_FLAT_ABOVE;
}

/**
 * Calculate verifier fee for a single milestone (assumes equal split across
 * milestones when only contract-level totals are provided).
 */
export function calculateVerifierFee(config: VerifierFeeConfig): number {
  const { totalContractValue, totalMilestones, customFeePercent } = config;

  // Admin custom override applies to the whole contract; split per milestone.
  if (customFeePercent !== undefined && customFeePercent > 0) {
    const total = totalContractValue * (customFeePercent / 100);
    return totalMilestones > 0 ? total / totalMilestones : total;
  }

  const milestoneAmount = totalContractValue / Math.max(1, totalMilestones);
  return feeForMilestone(milestoneAmount);
}

/**
 * Get verifier fee breakdown for a contract using the tiered model
 * (5% ≤ K2,000, flat K150 above).
 */
export function getVerifierFeeBreakdown(
  totalContractValue: number,
  totalMilestones: number,
  customFeePercent?: number
): {
  totalFeePercent: number;
  feePerMilestone: number;
  feePerMilestonePercent: number;
  totalFeeAmount: number;
} {
  const milestones = Math.max(1, totalMilestones);

  // Admin override
  if (customFeePercent !== undefined && customFeePercent > 0) {
    const totalFeeAmount = totalContractValue * (customFeePercent / 100);
    return {
      totalFeePercent: customFeePercent,
      feePerMilestone: totalFeeAmount / milestones,
      feePerMilestonePercent: customFeePercent / milestones,
      totalFeeAmount,
    };
  }

  const milestoneAmount = totalContractValue / milestones;
  const feePerMilestone = feeForMilestone(milestoneAmount);
  const totalFeeAmount = feePerMilestone * milestones;
  const totalFeePercent = totalContractValue > 0 ? (totalFeeAmount / totalContractValue) * 100 : 0;

  return {
    totalFeePercent,
    feePerMilestone,
    feePerMilestonePercent: milestones > 0 ? totalFeePercent / milestones : 0,
    totalFeeAmount,
  };
}

/**
 * Pay farmer and verifier when milestone is approved
 * Farmer gets the milestone payment amount
 * Verifier gets fee based on contract value and milestone count
 */
export async function payMilestoneApproval(
  walletClient: any,
  farmerAddress: `0x${string}`,
  verifierAddress: `0x${string}`,
  milestonePaymentUSDC: number,
  verifierFeeConfig?: VerifierFeeConfig
): Promise<{
  farmerPayment: { hash: string; amount: number };
  verifierPayment: { hash: string; amount: number };
}> {
  // Calculate verifier fee
  let verifierFee: number;
  
  if (verifierFeeConfig) {
    verifierFee = calculateVerifierFee(verifierFeeConfig);
  } else {
    // Fallback: tiered 5%/flat-K150 model applied directly to the milestone amount
    verifierFee = feeForMilestone(milestonePaymentUSDC);
  }
  
  // Pay farmer
  const farmerResult = await transferUSDC(walletClient, farmerAddress, milestonePaymentUSDC);
  
  // Pay verifier
  const verifierResult = await transferUSDC(walletClient, verifierAddress, verifierFee);
  
  return {
    farmerPayment: { hash: farmerResult.transactionHash, amount: milestonePaymentUSDC },
    verifierPayment: { hash: verifierResult.transactionHash, amount: verifierFee },
  };
}

/**
 * Withdraw USDC to external wallet (Base network or Pandora)
 */
export interface WithdrawResult {
  transactionHash: string;
  amount: number;
  destination: string;
  method: 'base' | 'pandora';
}

export async function withdrawUSDC(
  walletClient: any,
  toAddress: `0x${string}`,
  amount: number,
  method: 'base' | 'pandora' = 'base'
): Promise<WithdrawResult> {
  if (method === 'pandora') {
    // Pandora integration placeholder
    // In production, this would call Pandora's API for off-ramp
    console.log('Pandora withdrawal initiated - placeholder');
    // For now, just do a regular transfer
    const result = await transferUSDC(walletClient, toAddress, amount);
    return {
      transactionHash: result.transactionHash,
      amount,
      destination: toAddress,
      method: 'pandora',
    };
  }
  
  // Direct Base network transfer
  const result = await transferUSDC(walletClient, toAddress, amount);
  return {
    transactionHash: result.transactionHash,
    amount,
    destination: toAddress,
    method: 'base',
  };
}

/**
 * Get milestone payment amounts from smart contract
 */
export interface MilestonePaymentInfo {
  milestoneId: number;
  name: string;
  paymentPercentage: number;
  paymentAmountUSDC: number;
  status: 'pending' | 'submitted' | 'verified' | 'rejected';
}

export async function getMilestonePayments(
  contractId: number,
  totalContractValueUSDC: number
): Promise<MilestonePaymentInfo[]> {
  try {
    const milestones = await getContractMilestones(contractId);
    
    if (!milestones || !Array.isArray(milestones)) {
      return [];
    }
    
    return milestones.map((m: any, index: number) => ({
      milestoneId: index,
      name: m.name || `Milestone ${index + 1}`,
      paymentPercentage: Number(m.paymentPercentage || 0),
      paymentAmountUSDC: (Number(m.paymentPercentage || 0) / 100) * totalContractValueUSDC,
      status: getMilestoneStatus(m.status),
    }));
  } catch (error) {
    console.error('Error getting milestone payments:', error);
    return [];
  }
}

function getMilestoneStatus(status: number): MilestonePaymentInfo['status'] {
  switch (status) {
    case 0: return 'pending';
    case 1: return 'submitted';
    case 2: return 'verified';
    case 3: return 'rejected';
    default: return 'pending';
  }
}

/**
 * Standard milestone types with default payment percentages
 */
export const STANDARD_MILESTONES = {
  LAND_PREPARATION: { name: 'Land Preparation', percentage: 10 },
  PLANTING: { name: 'Planting', percentage: 15 },
  FERTILIZER_APPLICATION: { name: 'Fertilizer Application', percentage: 10 },
  GROWTH_STAGE: { name: 'Growth Stage', percentage: 15 },
  PEST_CONTROL: { name: 'Pest Control', percentage: 10 },
  FLOWERING: { name: 'Flowering Stage', percentage: 15 },
  HARVEST: { name: 'Harvest', percentage: 25 },
};
