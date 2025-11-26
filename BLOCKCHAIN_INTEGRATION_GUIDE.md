# AgroChain360 Blockchain Integration Guide

## Overview

This guide explains how to integrate smart contracts into AgroChain360 for complete farm-to-table traceability using blockchain technology.

## What the Smart Contracts Do

### 1. **AgroChain360 Contract Manager** (`AgroChain360.sol`)

**Purpose**: Manages farming contracts with milestone-based payments and escrow

**Key Features**:
- **Escrow System**: Buyers deposit full payment upfront, held securely on-chain
- **Milestone Management**: Breaks contracts into verifiable stages (planting, growing, harvest, etc.)
- **Automated Payments**: Releases funds automatically when milestones are verified
- **Verification System**: Extension officers verify each milestone on-site
- **Dispute Resolution**: Built-in mechanisms for handling conflicts
- **Platform Fees**: 2% fee on each payment for platform sustainability
- **Officer Incentives**: 0.001 ETH per verification to reward extension officers

**Workflow**:
1. Buyer creates contract → deposits full payment to escrow
2. System generates milestones (e.g., 6 milestones for mangoes)
3. Farmer completes milestone → uploads evidence (photos, GPS, notes)
4. Extension officer verifies on-site → uploads verification evidence
5. Smart contract releases payment automatically (milestone % of total)
6. Repeat until harvest complete
7. Contract marked as completed

### 2. **Crop Journey NFT** (`CropJourneyNFT.sol`)

**Purpose**: Creates immutable traceability records from planting to consumer

**Key Features**:
- **Unique NFT per Crop Batch**: Each harvest gets a unique token ID
- **Journey Stages**: Planted → Growing → PreHarvest → Harvested → Processing → Packaged → InTransit → Retail → Consumed
- **Immutable Records**: Every stage recorded on-chain with timestamp, location, evidence
- **QR Code Linking**: QR codes map to NFT token IDs for instant lookup
- **Ownership Transfer**: Tracks custody changes (farmer → processor → distributor → retailer)
- **Cold Chain Tracking**: Records temperature and humidity at each stage
- **Certifications**: Stores organic, GlobalGAP, and other certifications
- **Freshness Verification**: On-chain calculation of crop age and freshness

**Workflow**:
1. At planting: Mint NFT with crop details, farm location, QR code
2. During growth: Record each milestone stage on-chain
3. At harvest: Update NFT with harvest date
4. Processing: Transfer NFT to processor, record processing data
5. Packaging: Record batch number, packaging date
6. Distribution: Track location and cold chain data
7. Retail: Transfer to retailer, record shelf date
8. Consumer: Scan QR → view complete journey on-chain

---

## How Crop Tracking Works (Planting to Table)

### Stage 1: **Planting** (Day 0)
```
Farmer → Creates contract → Mints NFT
↓
Blockchain Records:
- Farmer address
- Crop type & variety
- Planting date & GPS coordinates
- Farm size & certifications
- Unique QR code generated
```

### Stage 2: **Growing** (Days 1-90)
```
Milestones (e.g., for Mangoes):
1. Land preparation (Day 0) → 10% payment
2. Planting verified (Day 7) → 15% payment
3. Flowering confirmed (Day 45) → 15% payment
4. Pest inspection passed (Day 60) → 15% payment
5. Pre-harvest quality check (Day 85) → 20% payment
6. Harvest & delivery (Day 90) → 25% payment

Each milestone:
- Farmer uploads evidence (photos, notes, GPS)
- Extension officer verifies on-site
- Smart contract releases payment automatically
- NFT updated with stage progress
```

### Stage 3: **Harvest** (Day 90)
```
Farmer → Harvests crop → Submits final milestone
↓
Extension Officer → Verifies quality & quantity
↓
Smart Contract → Releases final payment
↓
NFT → Updated with harvest date & quantity
↓
QR Code → Printed on crates/boxes
```

### Stage 4: **Processing** (Day 91-93)
```
Produce arrives at Cherry-Pick factory
↓
QR Code scanned → NFT ownership transferred to processor
↓
Blockchain Records:
- Processing date & location
- Batch number assigned
- Quality grading
- Processing methods (washing, sorting, packaging)
- Temperature logs
```

### Stage 5: **Packaging** (Day 93)
```
Products packaged with QR codes
↓
NFT Updated:
- Package date
- Package type
- Weight/quantity per package
- Expiry date
- Storage requirements
```

### Stage 6: **Distribution** (Day 94-95)
```
Products shipped to retailers/distributors
↓
NFT Records:
- Departure date & time
- Vehicle details
- Cold chain temperature logs
- Expected delivery date
- GPS tracking of shipment
```

### Stage 7: **Retail** (Day 96+)
```
Products arrive at retail stores
↓
QR Code scanned → NFT ownership transferred to retailer
↓
Blockchain Records:
- Retail location
- Shelf date
- Display conditions
- Price
```

### Stage 8: **Consumer** (Purchase)
```
Consumer scans QR code on product
↓
Mobile app displays:
- Complete farm-to-table journey
- Farmer profile & photo
- Farm location on map
- All verification records
- Processing & packaging dates
- Cold chain compliance
- Certifications (organic, etc.)
- Freshness indicator
- Sustainability score
```

---

## Implementation Steps

### Step 1: Install Dependencies

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts viem@^2.38.6
```

### Step 2: Initialize Hardhat

```bash
npx hardhat init
# Select "Create a TypeScript project"
```

### Step 3: Configure Hardhat for Base Network

Create `hardhat.config.ts`:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: [process.env.PRIVATE_KEY || ""],
      chainId: 84532,
    },
    base: {
      url: "https://mainnet.base.org",
      accounts: [process.env.PRIVATE_KEY || ""],
      chainId: 8453,
    },
  },
  etherscan: {
    apiKey: {
      baseSepolia: process.env.BASESCAN_API_KEY || "",
      base: process.env.BASESCAN_API_KEY || "",
    },
  },
};

export default config;
```

### Step 4: Deploy Smart Contracts

Create `scripts/deploy.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  console.log("Deploying AgroChain360 contracts...");

  // Deploy Contract Manager
  const AgroChain360Manager = await ethers.getContractFactory("AgroChain360ContractManager");
  const manager = await AgroChain360Manager.deploy();
  await manager.waitForDeployment();
  const managerAddress = await manager.getAddress();
  console.log("AgroChain360Manager deployed to:", managerAddress);

  // Deploy Crop Journey NFT
  const CropJourneyNFT = await ethers.getContractFactory("CropJourneyNFT");
  const nft = await CropJourneyNFT.deploy();
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("CropJourneyNFT deployed to:", nftAddress);

  // Grant roles
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const TRACKER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("TRACKER_ROLE"));
  
  await nft.grantRole(MINTER_ROLE, managerAddress);
  await nft.grantRole(TRACKER_ROLE, managerAddress);
  
  console.log("Roles granted successfully");
  
  console.log("\n=== Deployment Complete ===");
  console.log("Add these to your .env.local:");
  console.log(`NEXT_PUBLIC_CONTRACT_MANAGER_ADDRESS=${managerAddress}`);
  console.log(`NEXT_PUBLIC_CROP_NFT_ADDRESS=${nftAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Deploy to Base Sepolia (testnet):
```bash
npx hardhat run scripts/deploy.ts --network baseSepolia
```

### Step 5: Update Environment Variables

Add to `.env.local`:
```bash
# Existing
NEXT_PUBLIC_CDP_PROJECT_ID=your-cdp-project-id

# New - Smart Contract Addresses
NEXT_PUBLIC_CONTRACT_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_CROP_NFT_ADDRESS=0x...
NEXT_PUBLIC_NETWORK=testnet  # or "mainnet"

# For deployment
PRIVATE_KEY=your-private-key
BASESCAN_API_KEY=your-basescan-api-key
```

### Step 6: Integrate with Frontend

Example: Creating a contract from your app

```typescript
import { useWalletClient } from 'wagmi';
import { createFarmingContract } from '@/lib/blockchain/contractInteractions';

function CreateContractButton() {
  const { data: walletClient } = useWalletClient();

  const handleCreateContract = async () => {
    if (!walletClient) return;

    const params = {
      farmer: '0xFarmerAddress' as `0x${string}`,
      cropType: 'Mango',
      variety: 'Kent',
      requiredQuantity: 1000, // kg
      pricePerKg: 5, // USD
      harvestDeadline: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60), // 90 days
      ipfsMetadata: 'QmHash...', // Upload contract details to IPFS
      totalValue: parseEther('5000'), // 1000kg * $5
    };

    const result = await createFarmingContract(walletClient, params);
    console.log('Contract created:', result.transactionHash);
  };

  return <button onClick={handleCreateContract}>Create Contract</button>;
}
```

---

## Integration with Existing Features

### 1. **Farmer Dashboard Integration**

Update `components/FarmerDashboard.tsx`:

```typescript
import { getFarmerContracts, getContract } from '@/lib/blockchain/contractInteractions';
import { useAccount } from 'wagmi';

// Fetch on-chain contracts
const { address } = useAccount();
const contractIds = await getFarmerContracts(address);
const contracts = await Promise.all(
  contractIds.map(id => getContract(Number(id)))
);
```

### 2. **Milestone Submission**

Update `components/EvidenceUploadModal.tsx`:

```typescript
import { submitMilestoneEvidence } from '@/lib/blockchain/contractInteractions';

// Upload photos to IPFS first
const ipfsHash = await uploadToIPFS(photos);

// Submit to blockchain
await submitMilestoneEvidence(
  walletClient,
  contractId,
  milestoneId,
  ipfsHash
);
```

### 3. **Extension Officer Verification**

Update `components/OfficerVerificationModal.tsx`:

```typescript
import { verifyMilestone } from '@/lib/blockchain/contractInteractions';

// Upload verification evidence to IPFS
const ipfsHash = await uploadToIPFS(verificationData);

// Verify on blockchain
await verifyMilestone(
  walletClient,
  contractId,
  milestoneId,
  true, // approved
  ipfsHash
);
```

### 4. **QR Code Traceability**

Create `components/QRScanner.tsx`:

```typescript
import { getCropBatchByQR, getJourneyHistory } from '@/lib/blockchain/contractInteractions';

async function scanQRCode(qrCode: string) {
  // Get crop batch details
  const batch = await getCropBatchByQR(qrCode);
  
  // Get complete journey
  const journey = await getJourneyHistory(Number(batch.tokenId));
  
  // Display to consumer
  return {
    farmer: batch.farmer,
    cropType: batch.cropType,
    plantingDate: new Date(Number(batch.plantingDate) * 1000),
    harvestDate: new Date(Number(batch.harvestDate) * 1000),
    isOrganic: batch.isOrganic,
    certifications: batch.certifications,
    journey: journey.map(record => ({
      stage: record.stage,
      date: new Date(Number(record.timestamp) * 1000),
      location: record.location,
      notes: record.notes,
    })),
  };
}
```

---

## IPFS Integration for Evidence Storage

Smart contracts store IPFS hashes, not the actual files. You need IPFS for:
- Photos (farmer evidence, officer verification)
- Documents (certifications, quality reports)
- Contract metadata

### Option 1: Pinata (Recommended)

```bash
npm install pinata
```

```typescript
import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: "example-gateway.mypinata.cloud",
});

async function uploadToIPFS(file: File) {
  const upload = await pinata.upload.file(file);
  return upload.IpfsHash;
}
```

### Option 2: Web3.Storage

```bash
npm install web3.storage
```

---

## Benefits of This Implementation

### For Farmers:
✅ **Guaranteed Payments**: Escrow ensures they get paid for verified work
✅ **Fair Pricing**: Transparent pricing locked in contract
✅ **Proof of Origin**: NFT proves their crop's authenticity
✅ **Premium Pricing**: Traceability enables premium market access

### For Buyers (Cherry-Pick):
✅ **Quality Assurance**: Every milestone verified before payment
✅ **Supply Chain Visibility**: Real-time tracking of all crops
✅ **Risk Mitigation**: Escrow protects against non-delivery
✅ **Consumer Trust**: Blockchain proof builds brand credibility

### For Extension Officers:
✅ **Fair Compensation**: Instant payment for verifications
✅ **Reputation Building**: On-chain track record
✅ **Flexible Work**: Accept tasks on-demand (OEVN model)

### For Consumers:
✅ **Complete Transparency**: See entire farm-to-table journey
✅ **Food Safety**: Verify cold chain compliance
✅ **Support Farmers**: Know exactly who grew their food
✅ **Authenticity**: Blockchain-verified organic/certifications

---

## Cost Estimates (Base Network)

**Base Sepolia (Testnet)**: Free (test ETH from faucet)

**Base Mainnet**:
- Contract deployment: ~$5-10 per contract
- Create farming contract: ~$0.50-1.00
- Submit milestone: ~$0.10-0.20
- Verify milestone: ~$0.10-0.20
- Mint NFT: ~$0.50-1.00
- Record journey stage: ~$0.10-0.20

**Total per contract lifecycle**: ~$3-5 (split between parties)

---

## Testing Strategy

### 1. Unit Tests (Hardhat)

```bash
npx hardhat test
```

### 2. Testnet Testing (Base Sepolia)

1. Get test ETH from Base Sepolia faucet
2. Deploy contracts
3. Test complete workflow:
   - Create contract
   - Add milestones
   - Submit evidence
   - Verify milestones
   - Check payments
   - Mint NFT
   - Track journey

### 3. Integration Tests

Test with your existing Supabase data:
- Sync on-chain contracts with database
- Verify payment amounts match
- Ensure QR codes link correctly

---

## Security Considerations

✅ **Access Control**: Role-based permissions (Admin, Verifier, Minter)
✅ **Reentrancy Protection**: ReentrancyGuard on all payment functions
✅ **Pausable**: Emergency stop mechanism
✅ **Input Validation**: All parameters validated
✅ **Escrow Safety**: Funds locked until verification
✅ **Audit**: Consider professional audit before mainnet

---

## Monitoring & Analytics

Track on-chain metrics:
- Total contracts created
- Total value locked in escrow
- Average verification time
- Payment success rate
- NFT minting rate
- Most common crops
- Geographic distribution

Use The Graph for indexing:
```graphql
query {
  contracts(first: 10, orderBy: createdAt, orderDirection: desc) {
    id
    farmer
    cropType
    totalValue
    status
  }
}
```

---

## Next Steps

1. ✅ **Deploy to Testnet**: Test all functions thoroughly
2. ✅ **Integrate Frontend**: Connect existing UI to smart contracts
3. ✅ **IPFS Setup**: Configure Pinata or Web3.Storage
4. ✅ **Mobile QR Scanner**: Build consumer-facing app
5. ✅ **Audit**: Security review before mainnet
6. ✅ **Mainnet Launch**: Deploy to Base mainnet
7. ✅ **Marketing**: Promote blockchain traceability feature

---

## Support Resources

- **Base Documentation**: https://docs.base.org
- **Viem Documentation**: https://viem.sh
- **OpenZeppelin**: https://docs.openzeppelin.com
- **Hardhat**: https://hardhat.org/docs
- **IPFS**: https://docs.ipfs.tech

---

## Conclusion

This blockchain integration transforms AgroChain360 from a digital platform into a **trustless, transparent, and automated** farming ecosystem. Every crop's journey is permanently recorded, every payment is guaranteed, and every stakeholder benefits from reduced risk and increased trust.

The smart contracts handle the complex logic of escrow, milestone verification, and traceability, while your Next.js app provides the beautiful user interface farmers, officers, and consumers interact with.

**Result**: A complete farm-to-table solution that builds trust, ensures quality, and empowers farmers through blockchain technology.
