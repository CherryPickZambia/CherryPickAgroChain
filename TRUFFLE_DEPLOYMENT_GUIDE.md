# Cherry Pick - Truffle Deployment Guide

## Overview

This guide explains how to deploy Cherry Pick smart contracts to Base Network using Truffle.

## Prerequisites

1. **Node.js** (v18+)
2. **Truffle** installed globally:
   ```bash
   npm install -g truffle
   ```
3. **A wallet with ETH on Base** for gas fees
4. **BaseScan API Key** (for contract verification)

## Project Structure

```
cherry-pick/
├── contracts/
│   ├── CherryPickManager.sol    # Main contract
│   ├── CropJourneyNFT.sol       # NFT contract
│   └── CherryPickNFT.sol        # Certificate NFT
├── migrations/
│   └── 1_deploy_contracts.js    # Deployment script
├── truffle-config.js            # Truffle configuration
└── .env.local                   # Environment variables
```

## Step 1: Install Dependencies

```bash
npm install @truffle/hdwallet-provider dotenv @openzeppelin/contracts
```

## Step 2: Configure Environment

Update your `.env.local` file:

```env
# Private key of deployer wallet (no 0x prefix)
PRIVATE_KEY=your_private_key_here

# Deployer address
DEPLOYER_ADDRESS=0xYourWalletAddress

# BaseScan API key for verification
BASESCAN_API_KEY=your_basescan_api_key

# Network
NEXT_PUBLIC_NETWORK=mainnet
```

### Getting a BaseScan API Key

1. Go to https://basescan.org/register
2. Create an account
3. Go to https://basescan.org/myapikey
4. Create a new API key

## Step 3: Configure Truffle

Your `truffle-config.js` should look like:

```javascript
require('dotenv').config({ path: '.env.local' });
const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  contracts_directory: './contracts',
  contracts_build_directory: './build/contracts',
  
  networks: {
    // Base Mainnet
    base: {
      provider: () => new HDWalletProvider({
        privateKeys: [process.env.PRIVATE_KEY],
        providerOrUrl: 'https://mainnet.base.org',
        pollingInterval: 8000
      }),
      network_id: 8453,
      gas: 5000000,
      gasPrice: 1000000000, // 1 gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    
    // Base Sepolia Testnet (for testing)
    base_sepolia: {
      provider: () => new HDWalletProvider({
        privateKeys: [process.env.PRIVATE_KEY],
        providerOrUrl: 'https://sepolia.base.org',
        pollingInterval: 8000
      }),
      network_id: 84532,
      gas: 5000000,
      gasPrice: 1000000000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  },
  
  compilers: {
    solc: {
      version: "0.8.20",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: "paris"
      }
    }
  },
  
  plugins: ['truffle-plugin-verify'],
  
  api_keys: {
    basescan: process.env.BASESCAN_API_KEY
  }
};
```

## Step 4: Create Migration Script

Create or update `migrations/1_deploy_contracts.js`:

```javascript
const CherryPickManager = artifacts.require("CherryPickManager");
const CropJourneyNFT = artifacts.require("CropJourneyNFT");

module.exports = async function (deployer, network, accounts) {
  const deployerAddress = accounts[0];
  
  console.log("🚀 Deploying Cherry Pick contracts...");
  console.log("📍 Network:", network);
  console.log("👛 Deployer:", deployerAddress);
  
  // Deploy CropJourneyNFT first
  console.log("\n📦 Deploying CropJourneyNFT...");
  await deployer.deploy(CropJourneyNFT, "Cherry Pick Journey", "CPJ");
  const cropNFT = await CropJourneyNFT.deployed();
  console.log("✅ CropJourneyNFT deployed at:", cropNFT.address);
  
  // Deploy CherryPickManager
  console.log("\n📦 Deploying CherryPickManager...");
  await deployer.deploy(
    CherryPickManager,
    deployerAddress,  // Platform wallet for fees
    cropNFT.address   // NFT contract address
  );
  const manager = await CherryPickManager.deployed();
  console.log("✅ CherryPickManager deployed at:", manager.address);
  
  // Grant minter role to manager
  console.log("\n🔐 Setting up permissions...");
  const MINTER_ROLE = await cropNFT.MINTER_ROLE();
  await cropNFT.grantRole(MINTER_ROLE, manager.address);
  console.log("✅ Minter role granted to CherryPickManager");
  
  console.log("\n" + "=".repeat(50));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(50));
  console.log("\nContract Addresses:");
  console.log("-------------------");
  console.log("CherryPickManager:", manager.address);
  console.log("CropJourneyNFT:", cropNFT.address);
  console.log("\n📝 Add these to your .env.local:");
  console.log(`NEXT_PUBLIC_CONTRACT_MANAGER_ADDRESS=${manager.address}`);
  console.log(`NEXT_PUBLIC_CROP_NFT_ADDRESS=${cropNFT.address}`);
};
```

## Step 5: Compile Contracts

```bash
truffle compile
```

Expected output:
```
Compiling your contracts...
===========================
> Compiling ./contracts/CherryPickManager.sol
> Compiling ./contracts/CropJourneyNFT.sol
> Artifacts written to ./build/contracts
```

## Step 6: Deploy to Base Testnet (Recommended First)

```bash
truffle migrate --network base_sepolia
```

## Step 7: Deploy to Base Mainnet

⚠️ **This costs real ETH for gas fees!**

```bash
truffle migrate --network base
```

## Step 8: Verify Contracts

```bash
# Verify CherryPickManager
truffle run verify CherryPickManager --network base

# Verify CropJourneyNFT
truffle run verify CropJourneyNFT --network base
```

## Step 9: Update Environment Variables

After successful deployment, update `.env.local`:

```env
NEXT_PUBLIC_CONTRACT_MANAGER_ADDRESS=0x...  # From deployment output
NEXT_PUBLIC_CROP_NFT_ADDRESS=0x...          # From deployment output
```

## Deployment Costs Estimate

| Contract | Estimated Gas | Cost (at 0.001 gwei) |
|----------|--------------|----------------------|
| CherryPickManager | ~3,000,000 | ~$0.05 |
| CropJourneyNFT | ~2,500,000 | ~$0.04 |
| **Total** | ~5,500,000 | **~$0.10** |

*Costs are approximate and depend on network conditions*

## Troubleshooting

### "Insufficient funds"
- Make sure your deployer wallet has enough ETH on Base
- Get Base ETH from Coinbase or bridge from Ethereum

### "Transaction underpriced"
- Increase `gasPrice` in truffle-config.js
- Check current gas prices on BaseScan

### "Contract verification failed"
- Wait a few minutes after deployment
- Ensure BASESCAN_API_KEY is correct
- Try with `--forceConstructorArgs`

## Quick Commands

```bash
# Compile
truffle compile

# Deploy to testnet
truffle migrate --network base_sepolia

# Deploy to mainnet
truffle migrate --network base

# Verify contracts
truffle run verify CherryPickManager CropJourneyNFT --network base

# Open console
truffle console --network base
```

## After Deployment

1. ✅ Update `.env.local` with contract addresses
2. ✅ Restart the development server
3. ✅ Test contract interactions in the app
4. ✅ Verify contracts on BaseScan

## Support

- Base Documentation: https://docs.base.org
- Truffle Documentation: https://trufflesuite.com/docs/truffle/
- BaseScan: https://basescan.org
