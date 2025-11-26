/**
 * Cherry Pick - Smart Contract Test Script
 * Tests the deployed contracts on Base Mainnet
 */

const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

// Contract addresses (deployed)
const MANAGER_ADDRESS = '0x98AbA7800a086b799ea1d3160e3398079389dD76';
const NFT_ADDRESS = '0x6B4a6064d9F1486E138523282F2591cC43727F13';

// Load ABIs from build artifacts
const managerABI = JSON.parse(fs.readFileSync('./build/contracts/CherryPickManager.json')).abi;
const nftArtifact = JSON.parse(fs.readFileSync('./build/contracts/CherryPickNFT.json'));
const nftABI = nftArtifact.abi;

// Simplified NFT ABI for reliable reads
const nftReadABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function getTotalMinted() view returns (uint256)",
  "function getCropBatch(uint256 tokenId) view returns (tuple(uint256 tokenId, uint256 contractId, address farmer, string cropType, string variety, uint256 quantity, uint256 plantingDate, uint256 harvestDate, string farmLocation, string qrCode, uint8 currentStage, bool isOrganic, string certifications, uint8 qualityGrade))",
  "function verifyCrop(string qrCode) view returns (bool exists, uint256 tokenId, string cropType, address farmer, uint8 currentStage, uint256 journeySteps)",
  "function getJourneyHistory(uint256 tokenId) view returns (tuple(uint8 stage, uint256 timestamp, address recorder, address currentHolder, string location, string notes, string evidenceIPFS, int8 temperature, uint8 humidity)[])",
  "function mintCropBatch(uint256 contractId, address farmer, string cropType, string variety, uint256 quantity, string farmLocation, string qrCode, bool isOrganic, string certifications, string tokenURI) returns (uint256)",
  "function recordJourneyStage(uint256 tokenId, uint8 stage, string location, string notes, string evidenceIPFS, int8 temperature, uint8 humidity)"
];

async function main() {
  console.log('🧪 Cherry Pick - Contract Testing\n');
  console.log('='.repeat(50));
  
  // Connect
  const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log('📍 Network: Base Mainnet');
  console.log('👛 Tester:', wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Balance:', ethers.formatEther(balance), 'ETH\n');
  
  // Connect to contracts
  const manager = new ethers.Contract(MANAGER_ADDRESS, managerABI, wallet);
  const nft = new ethers.Contract(NFT_ADDRESS, nftReadABI, wallet);
  
  // ========== TEST 1: Read Contract Stats ==========
  console.log('📊 TEST 1: Reading Contract Stats...');
  try {
    const [totalContracts, platformFees] = await manager.getContractStats();
    console.log('   Total Contracts:', totalContracts.toString());
    console.log('   Platform Fees:', ethers.formatEther(platformFees), 'ETH');
    
    const verifierCount = await manager.getVerifierCount();
    console.log('   Total Verifiers:', verifierCount.toString());
    console.log('   ✅ Read stats successful!\n');
  } catch (e) {
    console.log('   ❌ Error:', e.message, '\n');
  }
  
  // ========== TEST 2: Check Verifier Status ==========
  console.log('👮 TEST 2: Checking Verifier Status...');
  try {
    const verifier = await manager.getVerifier(wallet.address);
    console.log('   Is Active:', verifier.isActive);
    console.log('   Total Verifications:', verifier.totalVerifications.toString());
    console.log('   Reputation:', verifier.reputation.toString(), '/100');
    console.log('   ✅ Verifier check successful!\n');
  } catch (e) {
    console.log('   ❌ Error:', e.message, '\n');
  }
  
  // ========== TEST 3: Check NFT Stats ==========
  console.log('🎨 TEST 3: Checking NFT Contract...');
  try {
    const totalMinted = await nft.getTotalMinted();
    const name = await nft.name();
    const symbol = await nft.symbol();
    console.log('   Name:', name);
    console.log('   Symbol:', symbol);
    console.log('   Total Minted:', totalMinted.toString());
    console.log('   ✅ NFT check successful!\n');
  } catch (e) {
    console.log('   ❌ Error:', e.message, '\n');
  }
  
  // ========== TEST 4: Mint a Test NFT Certificate ==========
  console.log('🌱 TEST 4: Minting Test Crop Certificate...');
  let mintedTokenId = null;
  let testQR = null;
  
  try {
    testQR = `QR-TEST-${Date.now()}`;
    
    const tx = await nft.mintCropBatch(
      0,                              // contractId (0 for test)
      wallet.address,                 // farmer
      'Mangoes',                      // cropType
      'Kent',                         // variety
      100,                            // quantity (100 kg)
      'Lusaka, Zambia',              // farmLocation
      testQR,                         // qrCode (unique)
      true,                           // isOrganic
      'Organic Certified',            // certifications
      'ipfs://test-metadata'          // tokenURI
    );
    
    console.log('   📝 Transaction sent:', tx.hash);
    console.log('   ⏳ Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('   ✅ NFT Minted! Gas used:', receipt.gasUsed.toString());
    console.log('   🔗 View: https://basescan.org/tx/' + tx.hash);
    
    // Get the token ID from getTotalMinted
    mintedTokenId = await nft.getTotalMinted();
    console.log('   🎉 Token ID:', mintedTokenId.toString());
    console.log('');
    
  } catch (e) {
    console.log('   ❌ Mint Error:', e.message);
    console.log('');
  }
  
  // ========== TEST 5: Read minted token directly ==========
  if (mintedTokenId) {
    console.log('🔍 TEST 5: Reading Minted Token...');
    try {
      // Check owner
      const owner = await nft.ownerOf(mintedTokenId);
      console.log('   Owner:', owner);
      
      // Check balance
      const balance = await nft.balanceOf(wallet.address);
      console.log('   Your NFT Balance:', balance.toString());
      
      console.log('   ✅ Token read successful!\n');
    } catch (e) {
      console.log('   ❌ Read Error:', e.message, '\n');
    }
    
    // ========== TEST 6: Update journey stage ==========
    console.log('📦 TEST 6: Recording Journey Stage (Growing)...');
    try {
      const tx2 = await nft.recordJourneyStage(
        mintedTokenId,                  // Use the actual minted token ID
        1,                              // Growing stage
        'Lusaka Farm',                  // location
        'Crops growing well',           // notes
        '',                             // evidenceIPFS
        25,                             // temperature (25°C)
        60                              // humidity (60%)
      );
      console.log('   📝 Transaction sent:', tx2.hash);
      const receipt2 = await tx2.wait();
      console.log('   ✅ Journey updated! Gas used:', receipt2.gasUsed.toString());
      console.log('   🔗 View: https://basescan.org/tx/' + tx2.hash);
      console.log('');
    } catch (e) {
      console.log('   ❌ Journey Error:', e.message, '\n');
    }
    
    // ========== TEST 7: Get journey history ==========
    console.log('📜 TEST 7: Getting Journey History...');
    try {
      const history = await nft.getJourneyHistory(mintedTokenId);
      console.log('   Total Records:', history.length);
      const stages = ['Planted', 'Growing', 'Flowering', 'PreHarvest', 'Harvested', 'Processing', 'Packaged', 'InTransit', 'AtRetail', 'Sold'];
      history.forEach((record, i) => {
        console.log(`   [${i}] Stage: ${stages[Number(record.stage)]}`);
        console.log(`       Location: ${record.location}`);
        console.log(`       Notes: ${record.notes}`);
      });
      console.log('   ✅ History retrieved!\n');
    } catch (e) {
      console.log('   ❌ History Error:', e.message, '\n');
    }
  }
  
  console.log('='.repeat(50));
  console.log('🎉 Testing Complete!\n');
}

main().catch(console.error);
