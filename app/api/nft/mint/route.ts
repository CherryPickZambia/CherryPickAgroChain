/**
 * API Route: Mint Traceability NFT
 * POST /api/nft/mint
 * 
 * Mints a traceability NFT on Base mainnet using the deployer wallet.
 * This keeps the private key secure on the server side.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, baseSepolia } from 'viem/chains';
import axios from 'axios';
import { CropJourneyNFTABI } from '@/lib/blockchain/abis/CropJourneyNFT';

// Network configuration
const NETWORK = process.env.NEXT_PUBLIC_NETWORK === 'mainnet' ? 'base' : 'baseSepolia';
const chain = NETWORK === 'base' ? base : baseSepolia;
const EXPLORER_URL = NETWORK === 'base' ? 'https://basescan.org' : 'https://sepolia.basescan.org';
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CROP_NFT_ADDRESS as `0x${string}`;

// Create public client
const publicClient = createPublicClient({
    chain,
    transport: http(),
});

// Get deployer account
function getDeployerAccount() {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('PRIVATE_KEY not configured');
    }
    const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    return privateKeyToAccount(formattedKey as `0x${string}`);
}

// Upload metadata to IPFS via Pinata
async function uploadMetadataToIPFS(metadata: any): Promise<string> {
    const PINATA_JWT = process.env.PINATA_JWT || process.env.NEXT_PUBLIC_PINATA_JWT;

    if (!PINATA_JWT) {
        throw new Error('Pinata JWT not configured');
    }

    const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        {
            pinataContent: metadata,
            pinataMetadata: {
                name: `AgroChain360-${metadata.properties.batch_code}`,
                keyvalues: {
                    type: 'traceability_nft',
                    batch_code: metadata.properties.batch_code,
                }
            }
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${PINATA_JWT}`,
            },
        }
    );

    return `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            batchCode,
            cropType,
            variety,
            farmerName,
            farmerAddress,
            quantity,
            qualityGrade,
            processingMethods,
            productionDate,
            expiryDate,
            storageConditions,
            farmLocation,
            isOrganic,
            certifications,
        } = body;

        // Validate required fields
        if (!batchCode || !cropType || !farmerName) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: batchCode, cropType, farmerName' },
                { status: 400 }
            );
        }

        console.log('🚀 Starting NFT mint for batch:', batchCode);

        // Step 1: Create NFT metadata
        const metadata = {
            name: `AgroChain360 Traceability Certificate - ${batchCode}`,
            description: `Official traceability certificate for ${cropType} batch ${batchCode}. This NFT represents a verified agricultural product that has passed quality checks and is ready for distribution. Farmer: ${farmerName}. Grade: ${qualityGrade}.`,
            external_url: `https://agrochain360.vercel.app/lookup?batch=${batchCode}`,
            attributes: [
                { trait_type: 'Batch Code', value: batchCode },
                { trait_type: 'Crop Type', value: cropType },
                { trait_type: 'Farmer', value: farmerName },
                { trait_type: 'Quality Grade', value: qualityGrade || 'Standard' },
                { trait_type: 'Quantity', value: quantity || 0 },
                { trait_type: 'Production Date', value: productionDate || new Date().toISOString().split('T')[0] },
                { trait_type: 'Processing Methods', value: (processingMethods || []).join(', ') || 'Fresh' },
                { trait_type: 'Organic', value: isOrganic ? 'Yes' : 'No' },
            ],
            properties: {
                batch_code: batchCode,
                crop_type: cropType,
                farmer_name: farmerName,
                quantity: `${quantity || 0} kg`,
                quality_grade: qualityGrade || 'Standard',
                processing_methods: processingMethods || [],
                processing_date: productionDate || new Date().toISOString().split('T')[0],
                expiry_date: expiryDate,
                storage_conditions: storageConditions,
                certifications: certifications || [],
            },
        };

        // Step 2: Upload to IPFS
        console.log('📤 Uploading metadata to IPFS...');
        const metadataUrl = await uploadMetadataToIPFS(metadata);
        console.log('✅ Metadata uploaded:', metadataUrl);

        // Step 3: Get wallet client
        const account = getDeployerAccount();
        const walletClient = createWalletClient({
            account,
            chain,
            transport: http(),
        });

        console.log('👛 Minting from:', account.address);

        // Step 4: Prepare mint parameters
        const farmerWallet = (farmerAddress || account.address) as `0x${string}`;
        const contractId = 0; // Standalone NFT

        // Step 5: Simulate transaction
        console.log('🔍 Simulating transaction...');
        const { request: mintRequest } = await publicClient.simulateContract({
            address: CONTRACT_ADDRESS,
            abi: CropJourneyNFTABI,
            functionName: 'mintCropBatch',
            args: [
                BigInt(contractId),
                farmerWallet,
                cropType,
                variety || '',
                BigInt(quantity || 0),
                farmLocation || 'Zambia',
                batchCode,
                isOrganic || false,
                (certifications || []).join(','),
                metadataUrl,
            ],
            account: account,
        });

        // Step 6: Execute transaction
        console.log('⛓️ Sending transaction...');
        const hash = await walletClient.writeContract(mintRequest);
        console.log('📝 Transaction hash:', hash);

        // Step 7: Wait for confirmation
        console.log('⏳ Waiting for confirmation...');
        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
            confirmations: 1,
        });
        console.log('✅ Confirmed! Block:', receipt.blockNumber);

        const explorerUrl = `${EXPLORER_URL}/tx/${hash}`;

        return NextResponse.json({
            success: true,
            transactionHash: hash,
            metadataUrl,
            explorerUrl,
            blockNumber: Number(receipt.blockNumber),
        });

    } catch (error: any) {
        console.error('❌ NFT minting failed:', error);

        let errorMessage = error.message || 'Unknown error';

        if (errorMessage.includes('insufficient funds')) {
            errorMessage = 'Insufficient ETH for gas fees. Please fund the deployer wallet.';
        } else if (errorMessage.includes('MINTER_ROLE') || errorMessage.includes('AccessControl')) {
            errorMessage = 'Wallet does not have MINTER_ROLE permission on the contract.';
        } else if (errorMessage.includes('execution reverted')) {
            errorMessage = 'Transaction reverted. Check contract state and parameters.';
        }

        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}

// GET endpoint to check deployer wallet balance
export async function GET() {
    try {
        const account = getDeployerAccount();
        const balance = await publicClient.getBalance({ address: account.address });
        const balanceETH = Number(balance) / 1e18;

        return NextResponse.json({
            address: account.address,
            balanceETH,
            hasEnoughGas: balanceETH > 0.001,
            network: NETWORK,
            contractAddress: CONTRACT_ADDRESS,
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
