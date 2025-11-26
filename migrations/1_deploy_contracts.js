const CherryPickManager = artifacts.require("CherryPickManager");
const CherryPickNFT = artifacts.require("CherryPickNFT");

module.exports = async function(deployer, network, accounts) {
  const deployerAddress = accounts[0];
  
  console.log("\n========================================");
  console.log("🍒 Deploying Cherry Pick Smart Contracts");
  console.log("========================================\n");
  
  console.log("Network:", network);
  console.log("Deployer:", deployerAddress);
  console.log("");

  // Deploy CherryPickManager (with deployer as platform wallet)
  console.log("📝 Deploying CherryPickManager...");
  await deployer.deploy(CherryPickManager, deployerAddress);
  const manager = await CherryPickManager.deployed();
  console.log("✅ CherryPickManager deployed to:", manager.address);
  console.log("   Platform wallet set to:", deployerAddress);
  console.log("");

  // Deploy CherryPickNFT (with manager address)
  console.log("🎨 Deploying CherryPickNFT...");
  await deployer.deploy(CherryPickNFT, manager.address);
  const nft = await CherryPickNFT.deployed();
  console.log("✅ CherryPickNFT deployed to:", nft.address);
  console.log("");

  // Print summary
  console.log("========================================");
  console.log("🎉 Deployment Complete!");
  console.log("========================================\n");
  
  console.log("📋 Contract Addresses:\n");
  console.log(`CherryPickManager: ${manager.address}`);
  console.log(`CherryPickNFT:     ${nft.address}`);
  console.log("");
  
  console.log("📋 Add these to your .env.local file:\n");
  console.log(`NEXT_PUBLIC_CONTRACT_MANAGER_ADDRESS=${manager.address}`);
  console.log(`NEXT_PUBLIC_CROP_NFT_ADDRESS=${nft.address}`);
  
  if (network === 'base') {
    console.log("NEXT_PUBLIC_NETWORK=mainnet\n");
    console.log("🔍 View on BaseScan:");
    console.log(`   Manager: https://basescan.org/address/${manager.address}`);
    console.log(`   NFT:     https://basescan.org/address/${nft.address}`);
    console.log("\n🔐 Verify contracts:");
    console.log(`   npx truffle run verify CherryPickManager --network base`);
    console.log(`   npx truffle run verify CherryPickNFT --network base`);
    console.log("\n⚠️  MAINNET DEPLOYMENT COMPLETE!");
    console.log("⚠️  These contracts are now live on Base mainnet.");
  } else {
    console.log("NEXT_PUBLIC_NETWORK=testnet\n");
    console.log("🔍 View on BaseScan:");
    console.log(`   Manager: https://sepolia.basescan.org/address/${manager.address}`);
    console.log(`   NFT:     https://sepolia.basescan.org/address/${nft.address}`);
    console.log("\n🔐 Verify contracts:");
    console.log(`   npx truffle run verify CherryPickManager --network baseSepolia`);
    console.log(`   npx truffle run verify CherryPickNFT --network baseSepolia`);
  }
  
  console.log("\n========================================\n");
};
