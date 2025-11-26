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

// Load ABIs
const managerABI = JSON.parse(fs.readFileSync('./build/contracts/CherryPickManager.json')).abi;
const nftABI = JSON.parse(fs.readFileSync('./build/contracts/CherryPickNFT.json')).abi;

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
  const nft = new ethers.Contract(NFT_ADDRESS, nftABI, wallet);
  
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
  try {
    const testQR = `QR-TEST-${Date.now()}`;
    
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
    
    // Get the token ID
    const totalMinted = await nft.getTotalMinted();
    console.log('   🎉 Token ID:', totalMinted.toString());
    console.log('   🔗 View: https://basescan.org/tx/' + tx.hash);
    console.log('');
    
    // Verify the crop
    console.log('🔍 TEST 5: Verifying Crop by QR Code...');
    const [exists, tokenId, cropType, farmer, stage, journeySteps] = await nft.verifyCrop(testQR);
    console.log('   Exists:', exists);
    console.log('   Token ID:', tokenId.toString());
    console.log('   Crop Type:', cropType);
    console.log('   Farmer:', farmer);
    console.log('   Current Stage:', ['Planted', 'Growing', 'Flowering', 'PreHarvest', 'Harvested', 'Processing', 'Packaged', 'InTransit', 'AtRetail', 'Sold'][Number(stage)]);
    console.log('   Journey Steps:', journeySteps.toString());
    console.log('   ✅ Verification successful!\n');
    
    // Update journey stage
    console.log('📦 TEST 6: Recording Journey Stage (Growing)...');
    const tx2 = await nft.recordJourneyStage(
      tokenId,
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
    
    // Get journey history
    console.log('📜 TEST 7: Getting Journey History...');
    const history = await nft.getJourneyHistory(tokenId);
    console.log('   Total Records:', history.length);
    history.forEach((record, i) => {
      console.log(`   [${i}] Stage: ${['Planted', 'Growing', 'Flowering', 'PreHarvest', 'Harvested', 'Processing', 'Packaged', 'InTransit', 'AtRetail', 'Sold'][Number(record.stage)]}`);
      console.log(`       Location: ${record.location}`);
      console.log(`       Notes: ${record.notes}`);
    });
    console.log('   ✅ History retrieved!\n');
    
  } catch (e) {
    console.log('   ❌ Error:', e.message);
    if (e.message.includes('insufficient funds')) {
      console.log('   💡 Need more ETH for gas!');
    }
    console.log('');
  }
  
  console.log('='.repeat(50));
  console.log('🎉 Testing Complete!\n');
}

main().catch(console.error);
