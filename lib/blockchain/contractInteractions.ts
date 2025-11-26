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
    eventName,
    onLogs: callback,
  });
}
