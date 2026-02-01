/**
 * Simple deployment script for AgrochainMarketplace
 * Run: node deploy-marketplace.js
 */

const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
const RPC_URL = 'https://mainnet.base.org';

// Base Mainnet USDC Address
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const INITIAL_FEE_BPS = 500; // 5%

async function main() {
    console.log('🚀 AgrochainMarketplace - Base Mainnet Deployment\n');

    if (!PRIVATE_KEY) {
        console.log('❌ ERROR: DEPLOYER_PRIVATE_KEY not set in .env.local');
        return;
    }

    // Connect to Base
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log('📍 Network: Base Mainnet (Chain ID: 8453)');
    console.log('👛 Deployer:', wallet.address);
    console.log('💰 Treasury:', wallet.address);
    console.log('📊 Initial Fee: 5%');
    console.log('💵 USDC:', USDC_ADDRESS);

    // Check balance
    const balance = await provider.getBalance(wallet.address);
    const ethBalance = ethers.formatEther(balance);
    console.log('💰 Balance:', ethBalance, 'ETH\n');

    if (parseFloat(ethBalance) < 0.0001) {
        console.log('❌ INSUFFICIENT FUNDS!');
        console.log('   You need at least 0.0001 ETH on Base mainnet');
        console.log('   Your wallet:', wallet.address);
        return;
    }

    // Load contract artifact
    const artifact = JSON.parse(
        fs.readFileSync('./build/contracts/AgrochainMarketplace.json', 'utf8')
    );

    console.log('📦 Deploying AgrochainMarketplace...');
    const Factory = new ethers.ContractFactory(
        artifact.abi,
        artifact.bytecode,
        wallet
    );

    // Deploy with constructor args: treasury, feeBps, usdc
    const contract = await Factory.deploy(wallet.address, INITIAL_FEE_BPS, USDC_ADDRESS);
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();

    console.log('\n' + '='.repeat(50));
    console.log('🎉 DEPLOYMENT COMPLETE!');
    console.log('='.repeat(50));
    console.log('\n✅ AgrochainMarketplace:', contractAddress);
    console.log('\n📝 Add to .env.local:');
    console.log(`NEXT_PUBLIC_MARKETPLACE_ADDRESS=${contractAddress}`);
    console.log('\n🔍 View on BaseScan:');
    console.log(`   https://basescan.org/address/${contractAddress}`);
    console.log('\n🔐 To verify on BaseScan:');
    console.log(`   npx hardhat verify --network base ${contractAddress} "${wallet.address}" ${INITIAL_FEE_BPS} "${USDC_ADDRESS}"`);
}

main().catch((error) => {
    console.error('❌ Deployment failed:', error.message);
    if (error.message.includes('insufficient funds')) {
        console.log('\n💡 You need more ETH on Base mainnet!');
    }
    process.exit(1);
});
