/**
 * Simple deployment script using ethers.js
 * Run: node deploy-simple.js
 */

const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = 'https://mainnet.base.org';

async function main() {
  console.log('🚀 Cherry Pick - Base Mainnet Deployment\n');

  // Connect to Base
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log('📍 Network: Base Mainnet (Chain ID: 8453)');
  console.log('👛 Deployer:', wallet.address);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  const ethBalance = ethers.formatEther(balance);
  console.log('💰 Balance:', ethBalance, 'ETH\n');

  if (parseFloat(ethBalance) < 0.0001) {
    console.log('❌ INSUFFICIENT FUNDS!');
    console.log('   You need at least 0.0001 ETH (~$0.35) on Base mainnet');
    console.log('   Your wallet:', wallet.address);
    console.log('\n   Get ETH on Base:');
    console.log('   1. Bridge from Ethereum: https://bridge.base.org');
    console.log('   2. Buy on Coinbase and withdraw to Base');
    return;
  }

  // Get current gas price
  const feeData = await provider.getFeeData();
  console.log('⛽ Gas Price:', ethers.formatUnits(feeData.gasPrice || 0, 'gwei'), 'gwei');

  // Load contract artifacts
  const managerArtifact = JSON.parse(
    fs.readFileSync('./build/contracts/CherryPickManager.json', 'utf8')
  );
  const nftArtifact = JSON.parse(
    fs.readFileSync('./build/contracts/CherryPickNFT.json', 'utf8')
  );

  console.log('\n📦 Deploying CherryPickManager...');
  const ManagerFactory = new ethers.ContractFactory(
    managerArtifact.abi,
    managerArtifact.bytecode,
    wallet
  );

  const manager = await ManagerFactory.deploy(wallet.address);
  await manager.waitForDeployment();
  const managerAddress = await manager.getAddress();
  console.log('✅ CherryPickManager:', managerAddress);

  console.log('\n📦 Deploying CherryPickNFT...');
  const NFTFactory = new ethers.ContractFactory(
    nftArtifact.abi,
    nftArtifact.bytecode,
    wallet
  );

  const nft = await NFTFactory.deploy(managerAddress);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log('✅ CherryPickNFT:', nftAddress);

  console.log('\n' + '='.repeat(50));
  console.log('🎉 DEPLOYMENT COMPLETE!');
  console.log('='.repeat(50));
  console.log('\n📝 Add to .env.local:');
  console.log(`NEXT_PUBLIC_CONTRACT_MANAGER_ADDRESS=${managerAddress}`);
  console.log(`NEXT_PUBLIC_CROP_NFT_ADDRESS=${nftAddress}`);
  console.log('\n🔍 View on BaseScan:');
  console.log(`   https://basescan.org/address/${managerAddress}`);
  console.log(`   https://basescan.org/address/${nftAddress}`);
}

main().catch((error) => {
  console.error('❌ Deployment failed:', error.message);
  if (error.message.includes('insufficient funds')) {
    console.log('\n💡 You need more ETH on Base mainnet!');
  }
  process.exit(1);
});
