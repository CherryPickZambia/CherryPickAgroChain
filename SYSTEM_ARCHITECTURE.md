# AgroChain360 System Architecture

## Complete System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACES                          │
├─────────────────────────────────────────────────────────────────┤
│  Farmer Dashboard  │  Officer Dashboard  │  Admin Dashboard     │
│  Buyer Portal      │  Consumer QR App    │  Mobile Apps         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION                          │
├─────────────────────────────────────────────────────────────────┤
│  • React Components (UI)                                        │
│  • API Routes (Backend)                                         │
│  • Authentication (CDP Wallets)                                 │
│  • State Management                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┴─────────────────────┐
        ↓                                           ↓
┌──────────────────────┐                  ┌──────────────────────┐
│   SUPABASE (DB)      │                  │  BLOCKCHAIN LAYER    │
├──────────────────────┤                  ├──────────────────────┤
│ • User Profiles      │                  │ • Viem Client        │
│ • Cached Data        │                  │ • Contract ABIs      │
│ • UI State           │                  │ • Wallet Connection  │
│ • Analytics          │                  │ • Transaction Mgmt   │
│ • Off-chain Metadata │                  └──────────────────────┘
└──────────────────────┘                            ↓
                                          ┌──────────────────────┐
                                          │   BASE NETWORK       │
                                          ├──────────────────────┤
                                          │ Smart Contracts:     │
                                          │ • AgroChain360Mgr    │
                                          │ • CropJourneyNFT     │
                                          └──────────────────────┘
                                                    ↓
                                          ┌──────────────────────┐
                                          │   IPFS (Pinata)      │
                                          ├──────────────────────┤
                                          │ • Photos             │
                                          │ • Documents          │
                                          │ • Evidence Files     │
                                          │ • NFT Metadata       │
                                          └──────────────────────┘
```

---

## Data Flow: Creating a Contract

```
┌──────────┐
│  Farmer  │ Fills contract form (crop, quantity, price)
└────┬─────┘
     ↓
┌────────────────┐
│  Frontend UI   │ Validates input, calculates milestones
└────┬───────────┘
     ↓
┌────────────────┐
│  Supabase      │ Saves draft contract (off-chain)
└────┬───────────┘
     ↓
┌────────────────┐
│  Buyer         │ Reviews and approves contract
└────┬───────────┘
     ↓
┌────────────────────┐
│  Smart Contract    │ Buyer deposits escrow (on-chain)
│  createContract()  │ Contract ID generated
└────┬───────────────┘
     ↓
┌────────────────┐
│  Blockchain    │ Contract stored immutably
└────┬───────────┘
     ↓
┌────────────────┐
│  Supabase      │ Updates contract status, stores contract ID
└────┬───────────┘
     ↓
┌────────────────┐
│  Frontend      │ Shows active contract to farmer
└────────────────┘
```

---

## Data Flow: Milestone Verification

```
┌──────────┐
│  Farmer  │ Completes milestone (e.g., planting)
└────┬─────┘
     ↓
┌────────────────┐
│  Mobile App    │ Takes photos, records GPS
└────┬───────────┘
     ↓
┌────────────────┐
│  IPFS Upload   │ Uploads photos → returns IPFS hash
└────┬───────────┘
     ↓
┌────────────────────────┐
│  Smart Contract        │ submitMilestoneEvidence(hash)
│  Milestone → Submitted │
└────┬───────────────────┘
     ↓
┌────────────────┐
│  OEVN System   │ Notifies nearest extension officers
└────┬───────────┘
     ↓
┌──────────────────┐
│  Officer         │ Accepts task, visits farm
└────┬─────────────┘
     ↓
┌────────────────┐
│  On-Site Check │ Verifies work, takes photos, records data
└────┬───────────┘
     ↓
┌────────────────┐
│  IPFS Upload   │ Uploads verification evidence → IPFS hash
└────┬───────────┘
     ↓
┌────────────────────────┐
│  Smart Contract        │ verifyMilestone(approved, hash)
│  Milestone → Verified  │
└────┬───────────────────┘
     ↓
┌────────────────────────┐
│  Automatic Payment     │ Calculates payment (% of total)
│  Escrow → Farmer       │ Releases funds instantly
└────┬───────────────────┘
     ↓
┌────────────────┐
│  Farmer Wallet │ Receives payment (e.g., $750)
└────┬───────────┘
     ↓
┌────────────────┐
│  Officer       │ Receives verification fee (0.001 ETH)
└────────────────┘
```

---

## Data Flow: Crop Traceability (QR Code Scan)

```
┌──────────────┐
│  Consumer    │ Scans QR code on product
└────┬─────────┘
     ↓
┌────────────────┐
│  QR Scanner    │ Reads QR code → extracts crop ID
└────┬───────────┘
     ↓
┌────────────────────────┐
│  Smart Contract        │ getCropBatchByQR(qrCode)
│  Returns NFT data      │
└────┬───────────────────┘
     ↓
┌────────────────────────┐
│  Smart Contract        │ getJourneyHistory(tokenId)
│  Returns all stages    │
└────┬───────────────────┘
     ↓
┌────────────────┐
│  IPFS          │ Fetches photos/evidence for each stage
└────┬───────────┘
     ↓
┌────────────────┐
│  Supabase      │ Gets farmer profile, additional metadata
└────┬───────────┘
     ↓
┌────────────────────────┐
│  Mobile App Display    │
├────────────────────────┤
│ • Farmer: John Banda   │
│ • Farm: Lusaka, Zambia │
│ • Planted: Jan 1, 2024 │
│ • Harvested: Mar 30    │
│ • Processed: Mar 31    │
│ • Packaged: Apr 2      │
│ • Freshness: 6 days    │
│ • Organic: ✅          │
│ • Cold Chain: ✅       │
│ • All Verifications: ✅│
└────────────────────────┘
```

---

## Smart Contract Architecture

```
┌───────────────────────────────────────────────────────────┐
│              AgroChain360ContractManager                  │
├───────────────────────────────────────────────────────────┤
│  State Variables:                                         │
│  • contracts: mapping(uint256 => FarmingContract)         │
│  • milestones: mapping(uint256 => Milestone[])            │
│  • farmerContracts: mapping(address => uint256[])         │
│  • verifierEarnings: mapping(address => uint256)          │
├───────────────────────────────────────────────────────────┤
│  Functions:                                               │
│  • createContract() - Buyer deposits escrow               │
│  • addMilestones() - Setup payment schedule               │
│  • submitMilestoneEvidence() - Farmer uploads proof       │
│  • verifyMilestone() - Officer verifies & releases payment│
│  • cancelContract() - Cancel before verification          │
│  • raiseDispute() - Handle conflicts                      │
├───────────────────────────────────────────────────────────┤
│  Access Control:                                          │
│  • ADMIN_ROLE - Platform admins                           │
│  • VERIFIER_ROLE - Extension officers                     │
│  • Public - Farmers, buyers                               │
├───────────────────────────────────────────────────────────┤
│  Security:                                                │
│  • ReentrancyGuard - Prevent reentrancy attacks           │
│  • Pausable - Emergency stop                              │
│  • AccessControl - Role-based permissions                 │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│                  CropJourneyNFT                           │
├───────────────────────────────────────────────────────────┤
│  Inherits:                                                │
│  • ERC721URIStorage - NFT standard with metadata          │
│  • AccessControl - Role-based permissions                 │
├───────────────────────────────────────────────────────────┤
│  State Variables:                                         │
│  • cropBatches: mapping(uint256 => CropBatch)             │
│  • journeyRecords: mapping(uint256 => JourneyRecord[])    │
│  • qrCodeToTokenId: mapping(string => uint256)            │
├───────────────────────────────────────────────────────────┤
│  Functions:                                               │
│  • mintCropBatch() - Create NFT at planting               │
│  • recordJourneyStage() - Add stage to journey            │
│  • transferCropBatch() - Transfer ownership               │
│  • getCropBatchByQR() - Lookup by QR code                 │
│  • getJourneyHistory() - Get complete journey             │
│  • isFresh() - Check freshness                            │
├───────────────────────────────────────────────────────────┤
│  Journey Stages:                                          │
│  0. Planted                                               │
│  1. Growing                                               │
│  2. PreHarvest                                            │
│  3. Harvested                                             │
│  4. Processing                                            │
│  5. Packaged                                              │
│  6. InTransit                                             │
│  7. Retail                                                │
│  8. Consumed                                              │
└───────────────────────────────────────────────────────────┘
```

---

## Frontend Integration Points

### 1. Farmer Dashboard (`components/FarmerDashboard.tsx`)

```typescript
// Fetch on-chain contracts
const contractIds = await getFarmerContracts(farmerAddress);
const contracts = await Promise.all(
  contractIds.map(id => getContract(Number(id)))
);

// Display contracts with real-time blockchain data
```

### 2. Evidence Upload (`components/EvidenceUploadModal.tsx`)

```typescript
// Upload photos to IPFS
const ipfsHash = await uploadToIPFS(photos);

// Submit to blockchain
const tx = await submitMilestoneEvidence(
  walletClient,
  contractId,
  milestoneId,
  ipfsHash
);

// Wait for confirmation
await tx.wait();
```

### 3. Officer Verification (`components/OfficerVerificationModal.tsx`)

```typescript
// Upload verification evidence
const ipfsHash = await uploadToIPFS(verificationData);

// Verify on blockchain (triggers payment)
const tx = await verifyMilestone(
  walletClient,
  contractId,
  milestoneId,
  true, // approved
  ipfsHash
);
```

### 4. QR Scanner (`components/QRScanner.tsx`)

```typescript
// Scan QR code
const qrCode = await scanQR();

// Fetch from blockchain
const batch = await getCropBatchByQR(qrCode);
const journey = await getJourneyHistory(batch.tokenId);

// Display to consumer
```

---

## Technology Stack Summary

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom + Lucide Icons
- **State**: React Hooks + Context

### Blockchain
- **Network**: Base (Ethereum L2)
- **Smart Contracts**: Solidity 0.8.20
- **Libraries**: OpenZeppelin
- **Client**: Viem (TypeScript)
- **Wallet**: Coinbase CDP Embedded Wallets

### Storage
- **Database**: Supabase (PostgreSQL)
- **File Storage**: IPFS (Pinata)
- **Blockchain**: Base Network

### Development
- **Smart Contracts**: Hardhat
- **Testing**: Hardhat + Chai
- **Deployment**: Hardhat Scripts
- **Verification**: BaseScan

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                      │
├─────────────────────────────────────────────────────────┤
│  Layer 1: Smart Contract Security                       │
│  • OpenZeppelin audited contracts                       │
│  • ReentrancyGuard on all payment functions             │
│  • Access control (role-based)                          │
│  • Input validation                                     │
│  • Pausable (emergency stop)                            │
├─────────────────────────────────────────────────────────┤
│  Layer 2: Application Security                          │
│  • CDP wallet authentication                            │
│  • Transaction signing                                  │
│  • Rate limiting                                        │
│  • Input sanitization                                   │
├─────────────────────────────────────────────────────────┤
│  Layer 3: Data Security                                 │
│  • IPFS for immutable storage                           │
│  • Encrypted private keys                               │
│  • HTTPS only                                           │
│  • Environment variables                                │
├─────────────────────────────────────────────────────────┤
│  Layer 4: Network Security                              │
│  • Base network (Ethereum L2)                           │
│  • Decentralized consensus                              │
│  • Immutable blockchain                                 │
└─────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

### Development (Local)
```
Developer Machine
  ↓
Local Hardhat Node (optional)
  ↓
Base Sepolia Testnet
```

### Staging
```
Vercel (Frontend)
  ↓
Supabase (Database)
  ↓
Base Sepolia Testnet (Smart Contracts)
  ↓
Pinata (IPFS)
```

### Production
```
Vercel (Frontend) - Global CDN
  ↓
Supabase (Database) - Multi-region
  ↓
Base Mainnet (Smart Contracts) - Decentralized
  ↓
Pinata (IPFS) - Distributed storage
```

---

## Scalability Considerations

### Current Capacity
- **Contracts**: Unlimited (blockchain)
- **Users**: 100,000+ (Supabase)
- **Transactions**: 1000+ per second (Base)
- **Storage**: Unlimited (IPFS)

### Optimization Strategies
1. **Caching**: Cache blockchain data in Supabase
2. **Batch Operations**: Group multiple transactions
3. **Lazy Loading**: Load data on-demand
4. **CDN**: Serve static assets globally
5. **Indexing**: Use The Graph for complex queries

---

## Monitoring & Analytics

### On-Chain Metrics
- Total contracts created
- Total value locked (TVL)
- Average verification time
- Payment success rate
- Gas costs per transaction

### Off-Chain Metrics
- User signups
- Active farmers
- QR code scans
- App usage
- Error rates

### Tools
- **BaseScan**: Blockchain explorer
- **Vercel Analytics**: Frontend performance
- **Supabase Dashboard**: Database metrics
- **Sentry**: Error tracking
- **The Graph**: Blockchain indexing

---

## Disaster Recovery

### Backup Strategy
1. **Smart Contracts**: Immutable on blockchain (no backup needed)
2. **Supabase**: Automatic daily backups
3. **IPFS**: Pinned files (permanent storage)
4. **Private Keys**: Encrypted, multi-location storage

### Recovery Plan
1. **Smart Contract Bug**: Deploy new version, migrate data
2. **Database Failure**: Restore from Supabase backup
3. **IPFS Failure**: Re-pin files from backup
4. **Network Outage**: Wait for Base network recovery

---

## Cost Breakdown (Annual)

### Infrastructure
- **Vercel**: $20/month = $240/year
- **Supabase**: $25/month = $300/year
- **Pinata**: $20/month = $240/year
- **Domain**: $15/year
- **Total**: ~$800/year

### Blockchain (Variable)
- **Deployment**: $10 (one-time)
- **Per Contract**: $0.50-1.00
- **1000 contracts/year**: ~$1000/year

### Total Annual Cost: ~$2000
### Revenue (2% fee on $500k): ~$10,000
### Net Profit: ~$8000/year (400% ROI)

---

## Conclusion

This architecture provides:
✅ **Scalability**: Handle thousands of contracts
✅ **Security**: Multi-layer protection
✅ **Reliability**: Decentralized, immutable
✅ **Performance**: Fast, efficient
✅ **Cost-Effective**: Low operational costs
✅ **User-Friendly**: Simple interfaces
✅ **Transparent**: Full traceability

**Ready to transform agriculture in Zambia! 🌾🚀**
