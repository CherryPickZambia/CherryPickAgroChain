// Simple deployment script for Base mainnet
const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URLS = [
  'https://mainnet.base.org',
  'https://base.llamarpc.com',
  'https://base.drpc.org',
  'https://1rpc.io/base'
];

async function findWorkingRPC() {
  for (const url of RPC_URLS) {
    try {
      console.log(`Testing ${url}...`);
      const provider = new ethers.JsonRpcProvider(url);
      const blockNumber = await Promise.race([
        provider.getBlockNumber(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
      ]);
      console.log(`✅ ${url} works! Block: ${blockNumber}`);
      return provider;
    } catch (e) {
      console.log(`❌ ${url} failed: ${e.message}`);
    }
  }
  throw new Error('No working RPC found');
}

async function deploy() {
  console.log('\n🍒 Cherry Pick - Base Mainnet Deployment\n');
  
  // Find working RPC
  console.log('Finding working RPC endpoint...\n');
  const provider = await findWorkingRPC();
  
  // Setup wallet
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log('\nDeployer:', wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log('Balance:', ethers.formatEther(balance), 'ETH\n');
  
  if (balance < ethers.parseEther('0.0003')) {
    throw new Error('Insufficient balance for deployment. Need at least 0.0003 ETH');
  }

  // Load compiled contracts
  const managerArtifact = JSON.parse(
    fs.readFileSync('./build/contracts/CherryPickManager.json', 'utf8')
  );
  const nftArtifact = JSON.parse(
    fs.readFileSync('./build/contracts/CherryPickNFT.json', 'utf8')
  );

  // Get current nonce
  let nonce = await provider.getTransactionCount(wallet.address);
  console.log('Starting nonce:', nonce);

  // Deploy CherryPickManager
  console.log('\n📝 Deploying CherryPickManager...');
  const ManagerFactory = new ethers.ContractFactory(
    managerArtifact.abi,
    managerArtifact.bytecode,
    wallet
  );
  
  const manager = await ManagerFactory.deploy(wallet.address, {
    gasLimit: 6000000,
    nonce: nonce++
  });
  console.log('Tx hash:', manager.deploymentTransaction().hash);
  console.log('Waiting for confirmation...');
  await manager.waitForDeployment();
  const managerAddress = await manager.getAddress();
  console.log('✅ CherryPickManager:', managerAddress);

  // Deploy CherryPickNFT
  console.log('\n🎨 Deploying CherryPickNFT...');
  const NFTFactory = new ethers.ContractFactory(
    nftArtifact.abi,
    nftArtifact.bytecode,
    wallet
  );
  
  const nft = await NFTFactory.deploy(managerAddress, {
    gasLimit: 4000000,
    nonce: nonce++
  });
  console.log('Tx hash:', nft.deploymentTransaction().hash);
  console.log('Waiting for confirmation...');
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log('✅ CherryPickNFT:', nftAddress);

  // Update .env.local
  console.log('\n📝 Updating .env.local...');
  let envContent = fs.readFileSync('.env.local', 'utf8');
  
  envContent = envContent.replace(
    /NEXT_PUBLIC_CONTRACT_MANAGER_ADDRESS=.*/,
    `NEXT_PUBLIC_CONTRACT_MANAGER_ADDRESS=${managerAddress}`
  );
  envContent = envContent.replace(
    /NEXT_PUBLIC_CROP_NFT_ADDRESS=.*/,
    `NEXT_PUBLIC_CROP_NFT_ADDRESS=${nftAddress}`
  );
  
  fs.writeFileSync('.env.local', envContent);
  console.log('✅ .env.local updated');

  // Summary
  console.log('\n========================================');
  console.log('🎉 Deployment Complete!');
  console.log('========================================\n');
  console.log('CherryPickManager:', managerAddress);
  console.log('CherryPickNFT:', nftAddress);
  console.log('\n🔍 View on BaseScan:');
  console.log(`   https://basescan.org/address/${managerAddress}`);
  console.log(`   https://basescan.org/address/${nftAddress}`);
  console.log('\n========================================\n');
}

deploy().catch(console.error);
