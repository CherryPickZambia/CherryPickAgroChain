# Base Mainnet Deployment Guide

## ⚠️ IMPORTANT: Mainnet Deployment Checklist

Before deploying to Base mainnet, ensure you have:

- [ ] **Tested thoroughly on Base Sepolia testnet**
- [ ] **Audited smart contracts** (recommended for production)
- [ ] **Real ETH on Base mainnet** (not test ETH)
- [ ] **Backup of private key** (secure, offline storage)
- [ ] **BaseScan API key** (for contract verification)
- [ ] **Reviewed all contract parameters**
- [ ] **Team approval** for mainnet deployment

---

## 🎯 What's Different: Mainnet vs Testnet

| Aspect | Testnet (Base Sepolia) | Mainnet (Base) |
|--------|----------------------|----------------|
| **ETH** | Free test ETH | Real ETH (costs money) |
| **Gas Fees** | Free | ~$0.001-0.01 per transaction |
| **Deployment Cost** | Free | ~$10-15 total |
| **Reversibility** | Can redeploy anytime | Permanent, immutable |
| **Risk** | Zero risk | Real financial risk |
| **Explorer** | sepolia.basescan.org | basescan.org |

---

## 💰 Cost Estimates (Base Mainnet)

### Deployment Costs (One-Time)

| Contract | Estimated Gas | Cost (at 0.001 gwei) |
|----------|--------------|---------------------|
| AgroChain360Manager | ~3,000,000 gas | ~$8-10 |
| CropJourneyNFT | ~2,500,000 gas | ~$6-8 |
| Role Setup | ~100,000 gas | ~$0.20 |
| **TOTAL** | **~5,600,000 gas** | **~$15-20** |

### Ongoing Costs (Per Transaction)

| Action | Estimated Gas | Cost |
|--------|--------------|------|
| Create Contract | ~200,000 gas | ~$0.50 |
| Submit Evidence | ~100,000 gas | ~$0.25 |
| Verify Milestone | ~150,000 gas | ~$0.35 |
| Mint NFT | ~150,000 gas | ~$0.35 |
| Record Journey | ~80,000 gas | ~$0.20 |

**Note**: Base has extremely low fees compared to Ethereum mainnet!

---

## 🚀 Mainnet Deployment Steps

### Step 1: Get Real ETH on Base Mainnet

**Option A: Bridge from Ethereum**
1. Go to: https://bridge.base.org
2. Connect wallet
3. Bridge ETH from Ethereum to Base
4. Wait ~10 minutes for confirmation

**Option B: Buy on Exchange**
1. Buy ETH on Coinbase
2. Withdraw to Base network
3. Use your wallet address

**Option C: Use On-Ramp**
1. Use Coinbase Wallet on-ramp
2. Buy directly on Base network

**Recommended Amount**: 0.02 ETH (~$50-60)
- Deployment: ~0.01 ETH
- Testing: ~0.005 ETH
- Buffer: ~0.005 ETH

---

### Step 2: Update Environment Variables

Update `.env.local`:

```bash
# Use your MAINNET private key (NOT testnet key)
PRIVATE_KEY=your_mainnet_private_key_without_0x

# Get API key from https://basescan.org/myapikey
BASESCAN_API_KEY=your_basescan_api_key

# Set to mainnet
NEXT_PUBLIC_NETWORK=mainnet
```

**⚠️ SECURITY WARNING**:
- Use a dedicated deployment wallet
- Never commit .env.local to git
- Store private key securely offline
- Consider using a hardware wallet

---

### Step 3: Verify Configuration

Check your Hardhat config (`hardhat.config.ts`):

```typescript
networks: {
  base: {
    url: "https://mainnet.base.org",
    accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    chainId: 8453,
    gasPrice: "auto", // ✅ Uses current network gas price
  },
}
```

**✅ Dynamic Gas Pricing Enabled**:
- No hardcoded gas prices
- Uses current Base network fees
- Automatically adjusts to network conditions

---

### Step 4: Final Pre-Deployment Checks

Run these commands to verify everything:

```bash
# 1. Check your balance
npx hardhat run scripts/check-balance.ts --network base

# 2. Estimate deployment cost
npx hardhat run scripts/estimate-cost.ts --network base

# 3. Compile contracts (final check)
npm run compile

# 4. Run tests (if you have any)
npx hardhat test
```

---

### Step 5: Deploy to Base Mainnet

**⚠️ FINAL WARNING**: This will deploy to MAINNET with REAL ETH!

```bash
npm run deploy:mainnet
```

**Or manually**:
```bash
npx hardhat run scripts/deploy.ts --network base
```

---

### Step 6: Monitor Deployment

The script will show:

```
🚀 Deploying AgroChain360 Smart Contracts...

Network: base
Chain ID: 8453
Deploying contracts with account: 0xYourAddress
Account balance: 0.02 ETH

Current gas price: 0.001 gwei  ← Dynamic, not hardcoded
Max fee per gas: 0.002 gwei

📝 Deploying AgroChain360ContractManager...
Transaction hash: 0xABC123...
Waiting for confirmations...
✅ AgroChain360Manager deployed to: 0xManagerAddress
Gas used: 3,000,000
Gas price: 0.001 gwei
Deployment cost: 0.003 ETH

🎨 Deploying CropJourneyNFT...
Transaction hash: 0xDEF456...
Waiting for confirmations...
✅ CropJourneyNFT deployed to: 0xNFTAddress
Gas used: 2,500,000
Gas price: 0.001 gwei
Deployment cost: 0.0025 ETH

🔐 Setting up roles...
✅ Roles granted successfully

============================================================
🎉 Deployment Complete!
============================================================

📋 Add these to your .env.local file:

NEXT_PUBLIC_CONTRACT_MANAGER_ADDRESS=0xManagerAddress
NEXT_PUBLIC_CROP_NFT_ADDRESS=0xNFTAddress
NEXT_PUBLIC_NETWORK=mainnet

============================================================

🔍 View contracts on BaseScan:
Manager: https://basescan.org/address/0xManagerAddress
NFT: https://basescan.org/address/0xNFTAddress

🔍 Verify contracts on BaseScan:
npx hardhat verify --network base 0xManagerAddress
npx hardhat verify --network base 0xNFTAddress

============================================================

⚠️  MAINNET DEPLOYMENT COMPLETE!
⚠️  These contracts are now live on Base mainnet.
⚠️  Double-check all addresses before using in production.
============================================================
```

---

### Step 7: Verify Contracts on BaseScan

**Why Verify?**
- Makes contract code publicly readable
- Builds trust with users
- Enables BaseScan features
- Required for some integrations

**How to Verify**:

```bash
# Verify Contract Manager
npx hardhat verify --network base 0xYourManagerAddress

# Verify NFT Contract
npx hardhat verify --network base 0xYourNFTAddress
```

**Expected Output**:
```
Successfully verified contract AgroChain360ContractManager on BaseScan.
https://basescan.org/address/0xYourAddress#code
```

---

### Step 8: Update Your Application

1. **Update `.env.local`** with mainnet addresses
2. **Restart your dev server**:
   ```bash
   npm run dev -- -p 3003
   ```
3. **Test in production mode**:
   ```bash
   npm run build
   npm start
   ```

---

### Step 9: Post-Deployment Testing

**Critical Tests**:

1. **Create Test Contract**
   - Admin creates a small test contract
   - Use minimal values (e.g., 1 kg, $1)
   - Verify contract appears on-chain

2. **Submit Test Evidence**
   - Farmer uploads test evidence
   - Check IPFS upload works
   - Verify milestone status updates

3. **Verify Test Milestone**
   - Officer verifies the test milestone
   - Check payment releases correctly
   - Verify blockchain transaction

4. **Mint Test NFT**
   - Create test crop batch
   - Verify NFT mints successfully
   - Check QR code links work

5. **Scan QR Code**
   - Generate QR code
   - Scan with mobile device
   - Verify complete journey displays

---

## 🔐 Security Best Practices

### Before Mainnet:

1. **Smart Contract Audit**
   - Hire professional auditors
   - Cost: $5,000-$20,000
   - Recommended: CertiK, OpenZeppelin, Trail of Bits

2. **Bug Bounty Program**
   - Offer rewards for finding bugs
   - Use platforms like Immunefi
   - Typical rewards: $1,000-$50,000

3. **Testnet Testing**
   - Test ALL features on testnet
   - Simulate real-world scenarios
   - Test edge cases and failures

### After Mainnet:

1. **Monitor Transactions**
   - Set up alerts for unusual activity
   - Monitor gas costs
   - Track contract interactions

2. **Backup & Recovery**
   - Document all contract addresses
   - Store deployment artifacts
   - Keep private keys secure

3. **Upgrade Plan**
   - Plan for future upgrades
   - Consider proxy patterns
   - Document upgrade procedures

---

## 🆘 Troubleshooting

### "Insufficient funds for gas"
**Solution**: 
- Get more ETH on Base mainnet
- Check you're on Base network (not Ethereum)
- Verify wallet has enough balance

### "Nonce too high"
**Solution**:
- Reset MetaMask: Settings → Advanced → Reset Account
- Wait a few minutes and try again

### "Transaction underpriced"
**Solution**:
- Our config uses `gasPrice: "auto"` - this shouldn't happen
- If it does, increase gas price manually in hardhat.config.ts

### "Contract deployment failed"
**Solution**:
- Check private key is correct
- Verify you have enough ETH
- Check network connection
- Try again in a few minutes

### "Verification failed"
**Solution**:
- Wait 1-2 minutes after deployment
- Ensure contract is fully confirmed
- Check BaseScan API key is valid
- Try verification again

---

## 📊 Gas Optimization

Our contracts are already optimized:

✅ **Optimizer Enabled** (200 runs)
✅ **Efficient Storage** (packed structs)
✅ **Minimal External Calls**
✅ **Batch Operations** where possible
✅ **No Loops** in critical paths

**Base Network Advantages**:
- 10-100x cheaper than Ethereum
- Fast confirmations (~2 seconds)
- EVM compatible
- Backed by Coinbase

---

## 🎯 Mainnet Checklist

Before going live:

- [ ] Contracts deployed successfully
- [ ] Contracts verified on BaseScan
- [ ] All roles granted correctly
- [ ] Test contract created and completed
- [ ] Evidence upload tested
- [ ] Payment release tested
- [ ] NFT minting tested
- [ ] QR code scanning tested
- [ ] Frontend updated with mainnet addresses
- [ ] Production build tested
- [ ] Team trained on mainnet procedures
- [ ] Monitoring set up
- [ ] Backup procedures documented

---

## 📚 Additional Resources

- **Base Docs**: https://docs.base.org
- **BaseScan**: https://basescan.org
- **Base Bridge**: https://bridge.base.org
- **Gas Tracker**: https://basescan.org/gastracker
- **Status**: https://status.base.org

---

## ⚠️ Final Warnings

1. **Mainnet is permanent** - Contracts cannot be deleted
2. **Real money at risk** - Test thoroughly first
3. **No undo button** - Double-check everything
4. **Gas costs real ETH** - Monitor spending
5. **Security is critical** - Follow best practices

---

## ✅ You're Ready When...

- ✅ Tested everything on testnet
- ✅ Have real ETH on Base mainnet
- ✅ Team is trained and ready
- ✅ Monitoring is set up
- ✅ Backup procedures in place
- ✅ Confident in contract security

---

**Ready to deploy? Run: `npm run deploy:mainnet`**

**Remember**: Measure twice, deploy once! 🚀
