# Truffle Deployment Guide - Ready to Deploy!

## ✅ Setup Complete!

Your smart contracts are configured and ready to deploy using **Truffle** - a simple, reliable CLI tool.

---

## 🎯 Your Wallet Configuration

**Deployer Address**: `0x919134626100399ed78D386beA6b27C8E0507b9D`  
**Network**: Base Mainnet (configured)  
**Private Key**: ✅ Configured in `.env.local`

---

## 🚀 Deploy Commands

### Deploy to Base Mainnet (Production)
```bash
truffle migrate --network base
```

### Deploy to Base Sepolia (Testnet - Recommended First)
```bash
truffle migrate --network baseSepolia
```

---

## 📊 What Will Happen

When you run the deploy command:

1. **Connects** to Base network using your wallet
2. **Compiles** contracts (if needed)
3. **Deploys** AgroChain360ContractManager
4. **Deploys** CropJourneyNFT
5. **Grants** roles between contracts
6. **Shows** contract addresses
7. **Displays** BaseScan links

**Estimated Time**: 2-3 minutes  
**Estimated Cost** (Mainnet): ~$15-20  
**Testnet Cost**: FREE (need test ETH)

---

## 💰 Gas Pricing

✅ **Dynamic Gas Pricing Enabled**
- `gasPrice: null` = Uses current network rates
- No hardcoded fees
- Automatically optimal pricing

---

## 📝 After Deployment

The script will output:

```
========================================
🎉 Deployment Complete!
========================================

📋 Add these to your .env.local file:

NEXT_PUBLIC_CONTRACT_MANAGER_ADDRESS=0xABC123...
NEXT_PUBLIC_CROP_NFT_ADDRESS=0xDEF456...
NEXT_PUBLIC_NETWORK=mainnet

🔍 View on BaseScan:
Manager: https://basescan.org/address/0xABC123...
NFT: https://basescan.org/address/0xDEF456...

⚠️  MAINNET DEPLOYMENT COMPLETE!
⚠️  These contracts are now live on Base mainnet.
========================================
```

Copy the addresses and update your `.env.local` file.

---

## 🔍 Useful Commands

```bash
# Compile contracts
truffle compile

# Run tests (if you have any)
truffle test

# Deploy to testnet
truffle migrate --network baseSepolia

# Deploy to mainnet
truffle migrate --network base

# Reset and redeploy
truffle migrate --network base --reset

# Check your wallet balance
truffle console --network base
> web3.eth.getBalance("0x919134626100399ed78D386beA6b27C8E0507b9D")
```

---

## ⚠️ Before Mainnet Deployment

**Checklist**:
- [ ] Have enough ETH on Base mainnet (~0.02 ETH recommended)
- [ ] Tested on Base Sepolia testnet first
- [ ] Verified wallet address is correct
- [ ] Ready for permanent deployment

---

## 🆘 Troubleshooting

### "Insufficient funds"
**Solution**: Get more ETH on Base mainnet
- Bridge from Ethereum: https://bridge.base.org
- Or buy on Coinbase

### "Network error"
**Solution**: Check internet connection, try again

### "Compilation failed"
**Solution**: Run `truffle compile` first

### "Transaction underpriced"
**Solution**: Already handled - we use `gasPrice: null` for auto pricing

---

## ✅ Ready to Deploy!

**For Testing (Recommended First)**:
```bash
truffle migrate --network baseSepolia
```

**For Production (When Ready)**:
```bash
truffle migrate --network base
```

---

## 🎉 Why Truffle?

✅ **Simple** - Just works, no complex setup  
✅ **Reliable** - Industry standard since 2015  
✅ **CLI-based** - Perfect for your needs  
✅ **Well-documented** - Lots of resources  
✅ **Dynamic gas** - No hardcoded fees  

---

**Ready when you are! Just run the deploy command! 🚀**
