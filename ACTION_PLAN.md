# Action Plan: Deploy Smart Contracts & Fix Errors

## 🎯 Goal
Deploy AgroChain360 smart contracts to Base Sepolia testnet and fix all TypeScript errors.

---

## ✅ Step-by-Step Instructions

### Step 1: Install Blockchain Dependencies (3 minutes)

**Option A: Use Setup Script (Easiest)**
```bash
.\setup-blockchain.bat
```

**Option B: Manual Installation**
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts dotenv --legacy-peer-deps
```

**Expected Output:**
```
added 234 packages in 45s
```

**What This Does:**
- ✅ Installs Hardhat (smart contract development framework)
- ✅ Installs OpenZeppelin (secure contract libraries)
- ✅ Installs Hardhat Toolbox (testing, deployment tools)
- ✅ Fixes all "Cannot find module" errors

---

### Step 2: Restart VS Code (1 minute)

**Why?** TypeScript needs to re-index after installing new packages.

**How:**
1. Close VS Code completely (not just the window)
2. Reopen VS Code
3. Open your project folder

**Verify:**
- Open `hardhat.config.ts` - errors should be gone
- Open `scripts/deploy.ts` - errors should be gone

---

### Step 3: Get Test ETH (2 minutes)

**Why?** You need ETH to deploy contracts (even on testnet).

**How:**
1. Go to: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
2. Connect your wallet (MetaMask or Coinbase Wallet)
3. Click "Send me test ETH"
4. Wait 10-30 seconds
5. You'll receive ~0.05 test ETH

**Verify:**
- Check your wallet balance
- Should show test ETH on Base Sepolia network

---

### Step 4: Add Private Key to .env.local (1 minute)

**How to Get Your Private Key:**

**MetaMask:**
1. Click your account icon
2. Account Details → Show Private Key
3. Enter password
4. Copy private key (without 0x prefix)

**Coinbase Wallet:**
1. Settings → Security
2. Show Recovery Phrase
3. Use a tool to derive private key (or use recovery phrase directly)

**Add to .env.local:**
```
PRIVATE_KEY=your_private_key_here_without_0x
```

**⚠️ SECURITY:**
- Use a TEST wallet only
- Never commit .env.local to git
- Never share your private key

---

### Step 5: Compile Smart Contracts (1 minute)

```bash
npm run compile
```

**Expected Output:**
```
Compiling 2 files with 0.8.20
Solidity compilation finished successfully
Compiled 2 Solidity files successfully
```

**What This Does:**
- ✅ Compiles `AgroChain360.sol`
- ✅ Compiles `CropJourneyNFT.sol`
- ✅ Generates ABIs (Application Binary Interfaces)
- ✅ Creates artifacts in `/artifacts` folder

**Verify:**
- Check `artifacts/` folder exists
- Should contain compiled contracts

---

### Step 6: Deploy to Base Sepolia (2 minutes)

```bash
npm run deploy:testnet
```

**Expected Output:**
```
🚀 Deploying AgroChain360 Smart Contracts...

Deploying contracts with account: 0xYourAddress
Account balance: 0.05 ETH

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

**What This Does:**
- ✅ Deploys both smart contracts to Base Sepolia
- ✅ Sets up roles and permissions
- ✅ Links contracts together
- ✅ Gives you contract addresses

---

### Step 7: Update .env.local (1 minute)

Copy the contract addresses from the deployment output:

```
NEXT_PUBLIC_CONTRACT_MANAGER_ADDRESS=0xABC123...
NEXT_PUBLIC_CROP_NFT_ADDRESS=0xDEF456...
```

**Paste into `.env.local`** (replace the empty values)

---

### Step 8: Verify Deployment (2 minutes)

**Check on BaseScan:**
1. Go to: https://sepolia.basescan.org
2. Search for your contract addresses
3. You should see:
   - Contract creation transaction
   - Contract code
   - Recent transactions

**Verify in App:**
```bash
npm run dev -- -p 3003
```

1. Open http://localhost:3003
2. Login as admin
3. Try creating a contract
4. Should work without errors

---

## 🔍 Troubleshooting

### Issue: "Insufficient funds for gas"
**Solution:** Get more test ETH from faucet

### Issue: "Nonce too high"
**Solution:** Reset MetaMask (Settings → Advanced → Reset Account)

### Issue: "Network error"
**Solution:** 
- Check internet connection
- Try again in a few minutes
- Base Sepolia might be congested

### Issue: TypeScript errors still showing
**Solution:**
1. Restart VS Code
2. Run `npm install --legacy-peer-deps` again
3. Delete `node_modules` and reinstall

### Issue: Deployment fails
**Solution:**
- Check private key is correct (no 0x prefix)
- Ensure you have test ETH
- Check `.env.local` is in project root

---

## ✅ Success Checklist

After completing all steps:

- [ ] Dependencies installed (`node_modules/hardhat` exists)
- [ ] VS Code restarted (no "Cannot find module" errors)
- [ ] Test ETH received (check wallet balance)
- [ ] Private key added to `.env.local`
- [ ] Contracts compiled successfully
- [ ] Contracts deployed to Base Sepolia
- [ ] Contract addresses added to `.env.local`
- [ ] Contracts visible on BaseScan
- [ ] App runs without errors
- [ ] Can create test contract in app

---

## 📊 Time Breakdown

| Step | Time | Difficulty |
|------|------|-----------|
| Install dependencies | 3 min | Easy |
| Restart VS Code | 1 min | Easy |
| Get test ETH | 2 min | Easy |
| Add private key | 1 min | Easy |
| Compile contracts | 1 min | Easy |
| Deploy contracts | 2 min | Easy |
| Update .env.local | 1 min | Easy |
| Verify deployment | 2 min | Easy |
| **TOTAL** | **13 min** | **Easy** |

---

## 🎯 What You'll Have After This

✅ **Smart Contracts Deployed**
- AgroChain360 Contract Manager (escrow & payments)
- Crop Journey NFT (traceability)

✅ **Blockchain Integration Working**
- Admin can create contracts
- Farmers can upload evidence
- Officers can verify
- Payments release automatically

✅ **QR Code Traceability**
- Complete farm-to-table tracking
- All evidence on blockchain
- Consumer can scan and verify

✅ **No TypeScript Errors**
- All "Cannot find module" errors fixed
- Only harmless warnings remain

---

## 🚀 Ready to Start?

**Run this command now:**
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts dotenv --legacy-peer-deps
```

Then follow steps 2-8 above.

**Total time: ~13 minutes from start to fully deployed smart contracts! 🎉**

---

## 📚 Additional Resources

- **Quick Start**: `QUICK_START_BLOCKCHAIN.md`
- **Error Fixes**: `FIXING_ERRORS.md`
- **Complete Guide**: `BLOCKCHAIN_INTEGRATION_GUIDE.md`
- **Workflow**: `UPDATED_WORKFLOW.md`

---

## 💡 Pro Tips

1. **Use a test wallet** - Never use your main wallet for testnet
2. **Save contract addresses** - You'll need them later
3. **Verify on BaseScan** - Confirms deployment worked
4. **Test thoroughly** - Try all features before mainnet
5. **Keep private key safe** - Never commit to git

---

**Let's deploy! Start with Step 1 now! 🚀**
