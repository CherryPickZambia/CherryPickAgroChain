# Quick Blockchain Setup Guide

## Prerequisites
- Node.js installed
- Your AgroChain360 app running
- A wallet with some Base Sepolia ETH (for testnet)

## Step 1: Install Blockchain Dependencies

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts dotenv
npm install --legacy-peer-deps
```

## Step 2: Get Test ETH

1. Go to Base Sepolia Faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
2. Enter your wallet address
3. Receive free test ETH

## Step 3: Configure Environment

Add to `.env.local`:

```bash
# Existing variables
NEXT_PUBLIC_CDP_PROJECT_ID=your-cdp-project-id
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key

# New blockchain variables
PRIVATE_KEY=your-wallet-private-key-without-0x
BASESCAN_API_KEY=your-basescan-api-key
NEXT_PUBLIC_NETWORK=testnet

# Will be filled after deployment
NEXT_PUBLIC_CONTRACT_MANAGER_ADDRESS=
NEXT_PUBLIC_CROP_NFT_ADDRESS=
```

⚠️ **IMPORTANT**: Never commit `.env.local` to git!

## Step 4: Compile Contracts

```bash
npx hardhat compile
```

Expected output:
```
Compiled 2 Solidity files successfully
```

## Step 5: Deploy to Base Sepolia (Testnet)

```bash
npx hardhat run scripts/deploy.ts --network baseSepolia
```

Expected output:
```
🚀 Deploying AgroChain360 Smart Contracts...

Deploying contracts with account: 0x...
Account balance: 0.5 ETH

📝 Deploying AgroChain360ContractManager...
✅ AgroChain360Manager deployed to: 0xABC123...

🎨 Deploying CropJourneyNFT...
✅ CropJourneyNFT deployed to: 0xDEF456...

🔐 Setting up roles...
✅ Roles granted successfully

============================================================
🎉 Deployment Complete!
============================================================

📋 Add these to your .env.local file:

NEXT_PUBLIC_CONTRACT_MANAGER_ADDRESS=0xABC123...
NEXT_PUBLIC_CROP_NFT_ADDRESS=0xDEF456...
NEXT_PUBLIC_NETWORK=testnet
```

## Step 6: Update .env.local

Copy the contract addresses from the deployment output and add them to `.env.local`.

## Step 7: Verify Contracts (Optional but Recommended)

```bash
npx hardhat verify --network baseSepolia <CONTRACT_MANAGER_ADDRESS>
npx hardhat verify --network baseSepolia <CROP_NFT_ADDRESS>
```

This makes your contracts readable on BaseScan.

## Step 8: Test the Integration

Restart your dev server:
```bash
npm run dev -- -p 3003
```

## Quick Test Checklist

- [ ] Contracts deployed successfully
- [ ] Addresses added to .env.local
- [ ] App restarts without errors
- [ ] Can create a test contract from Farmer Dashboard
- [ ] Can submit milestone evidence
- [ ] Extension officer can verify milestone
- [ ] Payment released automatically
- [ ] NFT minted for crop batch
- [ ] QR code links to on-chain data

## Troubleshooting

### "Insufficient funds"
- Get more test ETH from the faucet
- Each deployment costs ~$0.50 in test ETH

### "Nonce too high"
- Reset your MetaMask account (Settings → Advanced → Reset Account)

### "Contract not deployed"
- Check that addresses in .env.local match deployment output
- Verify you're on the correct network (testnet vs mainnet)

### "Transaction reverted"
- Check you have the correct role (Admin, Verifier, etc.)
- Ensure escrow amount matches contract value
- Verify milestone percentages sum to 100

## Next Steps

1. **Test Complete Workflow**: Create contract → Submit evidence → Verify → Check payment
2. **IPFS Setup**: Configure Pinata for storing photos/documents
3. **Mobile QR Scanner**: Build consumer-facing traceability app
4. **Mainnet Preparation**: Audit contracts before production deployment

## Cost Estimates

**Testnet (Base Sepolia)**: FREE (use faucet)

**Mainnet (Base)**:
- Deployment: ~$10 total (one-time)
- Per contract: ~$0.50-1.00
- Per milestone: ~$0.10-0.20
- Per NFT: ~$0.50-1.00

## Support

- Base Docs: https://docs.base.org
- Hardhat Docs: https://hardhat.org
- OpenZeppelin: https://docs.openzeppelin.com

## Security Reminders

✅ Never share your private key
✅ Never commit .env.local to git
✅ Use testnet first
✅ Audit contracts before mainnet
✅ Start with small amounts
