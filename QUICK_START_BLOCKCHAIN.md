# Quick Start: Deploy Smart Contracts

## Step 1: Install Dependencies (2 minutes)

Run the setup script:
```bash
setup-blockchain.bat
```

Or manually:
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts dotenv --legacy-peer-deps
```

## Step 2: Get Test ETH (2 minutes)

1. Go to: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
2. Connect your wallet (MetaMask or Coinbase Wallet)
3. Request test ETH (you'll get ~0.05 ETH)

## Step 3: Configure Environment (1 minute)

1. Open `.env.local`
2. Add your wallet private key:
   ```
   PRIVATE_KEY=your_private_key_here_without_0x
   ```

**⚠️ IMPORTANT**: 
- Never commit `.env.local` to git
- Use a test wallet, not your main wallet
- This is for testnet only

## Step 4: Compile Contracts (1 minute)

```bash
npm run compile
```

Expected output:
```
Compiled 2 Solidity files successfully
```

## Step 5: Deploy to Base Sepolia (2 minutes)

```bash
npm run deploy:testnet
```

Expected output:
```
🚀 Deploying AgroChain360 Smart Contracts...

✅ AgroChain360Manager deployed to: 0xABC123...
✅ CropJourneyNFT deployed to: 0xDEF456...
✅ Roles granted successfully

📋 Add these to your .env.local:
NEXT_PUBLIC_CONTRACT_MANAGER_ADDRESS=0xABC123...
NEXT_PUBLIC_CROP_NFT_ADDRESS=0xDEF456...
```

## Step 6: Update Environment (1 minute)

Copy the contract addresses from the output and paste them into `.env.local`:

```
NEXT_PUBLIC_CONTRACT_MANAGER_ADDRESS=0xABC123...
NEXT_PUBLIC_CROP_NFT_ADDRESS=0xDEF456...
```

## Step 7: Restart Dev Server

```bash
npm run dev -- -p 3003
```

## ✅ Verification

Test that everything works:

1. **Check contracts on BaseScan**:
   - Go to: https://sepolia.basescan.org
   - Search for your contract addresses
   - You should see your deployed contracts

2. **Test in your app**:
   - Admin creates a contract
   - Farmer uploads evidence
   - Officer verifies
   - Payment should release automatically

## 🔧 Troubleshooting

### "Insufficient funds"
- Get more test ETH from the faucet
- Wait a few minutes and try again

### "Nonce too high"
- Reset your MetaMask: Settings → Advanced → Reset Account

### "Contract deployment failed"
- Check your private key is correct
- Ensure you have test ETH
- Try again in a few minutes

### TypeScript errors still showing
- Restart VS Code
- Run: `npm install --legacy-peer-deps` again
- The errors should disappear after installation

## 📚 Next Steps

After deployment:

1. **Test complete workflow**:
   - Admin creates contract
   - Farmer uploads evidence (photos + IoT)
   - Officer verifies
   - Check payment on blockchain

2. **Verify contracts** (optional but recommended):
   ```bash
   npm run verify:testnet 0xYOUR_CONTRACT_ADDRESS
   ```

3. **Test QR code scanning**:
   - Create a contract
   - Complete milestones
   - Generate QR code
   - Scan and view traceability

## 🎯 What You Get

After deployment, you'll have:

✅ **Smart Contract Manager** - Handles escrow & payments
✅ **NFT Contract** - Tracks crop journey
✅ **Blockchain Integration** - All evidence on-chain
✅ **QR Traceability** - Complete farm-to-table tracking

## 💰 Costs

**Testnet (Base Sepolia)**: FREE
- Use test ETH from faucet
- Unlimited testing

**Mainnet (Base)**: ~$10-15 total
- Deployment: ~$10 (one-time)
- Per contract: ~$0.50-1.00
- Per milestone: ~$0.10-0.20

## 🆘 Need Help?

- **Blockchain Guide**: `BLOCKCHAIN_INTEGRATION_GUIDE.md`
- **Setup Guide**: `BLOCKCHAIN_SETUP.md`
- **Workflow**: `UPDATED_WORKFLOW.md`
- **Base Docs**: https://docs.base.org

---

**Total Time: ~10 minutes from start to deployed contracts! 🚀**
