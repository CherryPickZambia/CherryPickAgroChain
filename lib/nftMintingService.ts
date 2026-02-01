/**
 * NFT Minting Service for AgroChain360
 * Client-side service that calls the secure API route for minting
 */

import { getContractAddress, getExplorerUrl } from './blockchain/contractConfig';

/**
 * Mint Traceability NFT Parameters
 */
export interface MintTraceabilityNFTParams {
    batchCode: string;
    cropType: string;
    variety?: string;
    farmerName: string;
    farmerAddress?: string;
    quantity: number;
    qualityGrade: string;
    processingMethods: string[];
    productionDate: string;
    expiryDate?: string;
    storageConditions?: string;
    farmLocation?: string;
    isOrganic?: boolean;
    certifications?: string[];
}

/**
 * Mint Result
 */
export interface MintResult {
    success: boolean;
    transactionHash: string;
    tokenId?: number;
    metadataUrl?: string;
    explorerUrl: string;
    error?: string;
}

/**
 * Mint a Traceability NFT via the secure API route
 * This calls POST /api/nft/mint which handles the blockchain transaction server-side
 */
export async function mintTraceabilityNFT(params: MintTraceabilityNFTParams): Promise<MintResult> {
    const explorerBase = getExplorerUrl();

    try {
        console.log('🚀 Calling NFT minting API...');
        console.log('📦 Batch:', params.batchCode);

        const response = await fetch('/api/nft/mint', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Minting failed');
        }

        console.log('✅ NFT minted successfully!');
        console.log('📝 Transaction:', result.transactionHash);

        return {
            success: true,
            transactionHash: result.transactionHash,
            metadataUrl: result.metadataUrl,
            explorerUrl: result.explorerUrl,
        };

    } catch (error: any) {
        console.error('❌ NFT minting failed:', error);

        return {
            success: false,
            transactionHash: '',
            explorerUrl: explorerBase,
            error: error.message || 'Unknown error',
        };
    }
}

/**
 * Check deployer wallet balance via API
 */
export async function checkDeployerBalance(): Promise<{
    address: string;
    balanceETH: number;
    hasEnoughGas: boolean;
}> {
    try {
        const response = await fetch('/api/nft/mint');
        const result = await response.json();

        return {
            address: result.address || '',
            balanceETH: result.balanceETH || 0,
            hasEnoughGas: result.hasEnoughGas || false,
        };
    } catch (error: any) {
        console.error('Failed to check balance:', error);
        return {
            address: '',
            balanceETH: 0,
            hasEnoughGas: false,
        };
    }
}
