# AgroChain360 Blockchain - Quick Reference Card

## 🚀 Installation (5 minutes)

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Get test ETH from faucet
# Visit: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

# 3. Add to .env.local
PRIVATE_KEY=your-wallet-private-key
NEXT_PUBLIC_NETWORK=testnet

# 4. Deploy contracts
npm run deploy:testnet

# 5. Copy contract addresses to .env.local
NEXT_PUBLIC_CONTRACT_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_CROP_NFT_ADDRESS=0x...
```

---

## 📁 Files Created

### Smart Contracts
- `contracts/AgroChain360.sol` - Main contract manager
- `contracts/CropJourneyNFT.sol` - NFT traceability

### Integration
- `lib/blockchain/contractConfig.ts` - Network config
- `lib/blockchain/contractInteractions.ts` - API functions
- `lib/blockchain/abis/AgroChain360Manager.ts` - Contract ABI
- `lib/blockchain/abis/CropJourneyNFT.ts` - NFT ABI

### Config
- `hardhat.config.ts` - Hardhat setup
- `scripts/deploy.ts` - Deployment script
- `package.json` - Updated with blockchain scripts

### Documentation
- `BLOCKCHAIN_SUMMARY.md` - Executive overview
- `BLOCKCHAIN_INTEGRATION_GUIDE.md` - Complete guide
- `BLOCKCHAIN_SETUP.md` - Quick setup
- `SYSTEM_ARCHITECTURE.md` - Architecture diagrams
- `INSTALL_BLOCKCHAIN.md` - Installation help
- `QUICK_REFERENCE.md` - This file

---

## 🎯 What Smart Contracts Do

### AgroChain360 Contract Manager
**Purpose**: Escrow + milestone payments

**Key Functions**:
```typescript
// Create contract with escrow
createContract(farmer, crop, quantity, price, deadline, metadata)

// Add milestones (must sum to 100%)
addMilestones(contractId, names, descriptions, percentages, dates)

// Farmer submits evidence
submitMilestoneEvidence(contractId, milestoneId, ipfsHash)

// Officer verifies (triggers payment)
verifyMilestone(contractId, milestoneId, approved, ipfsHash)

// Get contract data
getContract(contractId)
getContractMilestones(contractId)
getFarmerContracts(farmerAddress)
```

### Crop Journey NFT
**Purpose**: Farm-to-table traceability

**Key Functions**:
```typescript
// Mint NFT at planting
mintCropBatch(contractId, farmer, crop, variety, quantity, location, qrCode, ...)

// Record journey stage
recordJourneyStage(tokenId, stage, location, notes, ipfsHash, temp, humidity)

// Transfer ownership
transferCropBatch(tokenId, newOwner, stage)

// Consumer lookup
getCropBatchByQR(qrCode)
getJourneyHistory(tokenId)
```

---

## 💡 Usage Examples

### Create Contract (Buyer)
```typescript
import { createFarmingContract } from '@/lib/blockchain/contractInteractions';
import { parseEther } from 'viem';

const result = await createFarmingContract(walletClient, {
  farmer: '0xFarmerAddress' as `0x${string}`,
  cropType: 'Mango',
  variety: 'Kent',
  requiredQuantity: 1000, // kg
  pricePerKg: 5, // USD
  harvestDeadline: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60),
  ipfsMetadata: 'QmHash...',
  totalValue: parseEther('5000'), // 1000kg * $5
});

console.log('Contract ID:', result.contractId);
```

### Submit Evidence (Farmer)
```typescript
import { submitMilestoneEvidence } from '@/lib/blockchain/contractInteractions';

// 1. Upload photos to IPFS
const ipfsHash = await uploadToIPFS(photos);

// 2. Submit to blockchain
await submitMilestoneEvidence(
  walletClient,
  contractId,
  milestoneId,
  ipfsHash
);
```

### Verify Milestone (Officer)
```typescript
import { verifyMilestone } from '@/lib/blockchain/contractInteractions';

// 1. Upload verification evidence
const ipfsHash = await uploadToIPFS(verificationData);

// 2. Verify (triggers automatic payment)
await verifyMilestone(
  walletClient,
  contractId,
  milestoneId,
  true, // approved
  ipfsHash
);
```

### Scan QR Code (Consumer)
```typescript
import { getCropBatchByQR, getJourneyHistory } from '@/lib/blockchain/contractInteractions';

const batch = await getCropBatchByQR('QR-MANGO-2024-001');
const journey = await getJourneyHistory(Number(batch.tokenId));

console.log('Farmer:', batch.farmer);
console.log('Planted:', new Date(Number(batch.plantingDate) * 1000));
console.log('Journey:', journey);
```

---

## 🔧 NPM Scripts

```bash
# Development
npm run dev                  # Start Next.js dev server
npm run dev -- -p 3003      # Start on port 3003

# Blockchain
npm run compile             # Compile smart contracts
npm run deploy:testnet      # Deploy to Base Sepolia
npm run deploy:mainnet      # Deploy to Base mainnet
npm run verify:testnet      # Verify on BaseScan (testnet)
npm run verify:mainnet      # Verify on BaseScan (mainnet)

# Production
npm run build               # Build for production
npm run start               # Start production server
```

---

## 🌐 Networks

### Base Sepolia (Testnet)
- **Chain ID**: 84532
- **RPC**: https://sepolia.base.org
- **Explorer**: https://sepolia.basescan.org
- **Faucet**: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- **Cost**: FREE (test ETH)

### Base Mainnet (Production)
- **Chain ID**: 8453
- **RPC**: https://mainnet.base.org
- **Explorer**: https://basescan.org
- **Cost**: ~$3-6 per contract lifecycle

---

## 💰 Cost Estimates

### Per Contract Lifecycle
| Action | Cost (USD) |
|--------|-----------|
| Create contract | $0.50-1.00 |
| Add milestones | $0.30-0.50 |
| Submit evidence (6x) | $0.60-1.20 |
| Verify milestones (6x) | $0.60-1.20 |
| Mint NFT | $0.50-1.00 |
| Record journey (8x) | $0.80-1.60 |
| **TOTAL** | **$3-6** |

### Revenue Model
- **Platform Fee**: 2% of contract value
- **Example**: $5000 contract = $100 fee
- **Blockchain Cost**: ~$5
- **Net Profit**: ~$95 per contract

---

## 📊 Journey Stages

### NFT Journey Stages (Enum)
```
0 = Planted
1 = Growing
2 = PreHarvest
3 = Harvested
4 = Processing
5 = Packaged
6 = InTransit
7 = Retail
8 = Consumed
```

### Milestone Status (Enum)
```
0 = Pending
1 = Submitted
2 = Verified
3 = Rejected
4 = Paid
```

### Contract Status (Enum)
```
0 = Active
1 = Completed
2 = Cancelled
3 = Disputed
```

---

## 🔐 Roles & Permissions

### ADMIN_ROLE
- Deploy contracts
- Add/remove verifiers
- Pause/unpause system
- Withdraw platform fees

### VERIFIER_ROLE (Extension Officers)
- Verify milestones
- Assign verification tasks
- Earn verification fees

### MINTER_ROLE
- Mint crop batch NFTs
- Usually granted to Contract Manager

### TRACKER_ROLE
- Record journey stages
- Update NFT metadata

### Public (Farmers, Buyers)
- Create contracts
- Submit evidence
- View contract data

---

## 🆘 Troubleshooting

### "Cannot find module 'hardhat'"
```bash
npm install --legacy-peer-deps
```

### "Insufficient funds"
- Get test ETH from Base Sepolia faucet
- Each deployment needs ~0.01 ETH

### "Transaction reverted"
- Check you have correct role
- Verify escrow amount matches contract value
- Ensure milestone percentages sum to 100

### "Nonce too high"
- Reset MetaMask: Settings → Advanced → Reset Account

### "Contract not deployed"
- Verify addresses in .env.local
- Check you're on correct network (testnet vs mainnet)

---

## 📚 Documentation Links

### Internal Docs
- **Quick Setup**: `BLOCKCHAIN_SETUP.md`
- **Full Guide**: `BLOCKCHAIN_INTEGRATION_GUIDE.md`
- **Summary**: `BLOCKCHAIN_SUMMARY.md`
- **Architecture**: `SYSTEM_ARCHITECTURE.md`

### External Resources
- **Base Docs**: https://docs.base.org
- **Viem Docs**: https://viem.sh
- **OpenZeppelin**: https://docs.openzeppelin.com
- **Hardhat**: https://hardhat.org
- **IPFS**: https://docs.ipfs.tech

---

## ✅ Testing Checklist

- [ ] Install dependencies
- [ ] Get test ETH
- [ ] Deploy to testnet
- [ ] Create test contract
- [ ] Add milestones
- [ ] Submit evidence
- [ ] Verify milestone
- [ ] Check payment received
- [ ] Mint NFT
- [ ] Record journey stages
- [ ] Scan QR code
- [ ] View complete journey

---

## 🎯 Next Steps

1. **Install**: `npm install --legacy-peer-deps`
2. **Deploy**: Follow `BLOCKCHAIN_SETUP.md`
3. **Test**: Create a test contract
4. **Integrate**: Connect your UI components
5. **Launch**: Deploy to mainnet when ready

---

## 📞 Support

**Questions?** Check the documentation:
- `BLOCKCHAIN_INTEGRATION_GUIDE.md` - Comprehensive guide
- `BLOCKCHAIN_SETUP.md` - Quick setup
- `SYSTEM_ARCHITECTURE.md` - Architecture details

**Need Help?**
- Base Discord: https://discord.gg/buildonbase
- CDP Portal: https://portal.cdp.coinbase.com

---

**Built for AgroChain360 🌾**
*Blockchain-powered farm-to-table traceability*
