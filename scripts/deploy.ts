/* eslint-disable @typescript-eslint/no-require-imports */
const hre = require("hardhat");
import * as fs from "fs";
import * as path from "path";

async function main() {
  const ethers = hre.ethers;
  
  console.log("🍒 Deploying Cherry Pick Smart Contracts to Base...\n");

  // Get network info
  const networkName: string = hre.network.name;
  const networkInfo = await ethers.provider.getNetwork();
  const chainId = networkInfo.chainId;
  console.log("Network:", networkName);
  console.log("Chain ID:", chainId.toString());
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  // Check minimum balance
  const minBalance = ethers.parseEther("0.01");
  if (balance < minBalance) {
    throw new Error(`Insufficient balance. Need at least 0.01 ETH, have ${ethers.formatEther(balance)} ETH`);
  }
  
  // Get current gas price
  const feeData = await ethers.provider.getFeeData();
  console.log("Current gas price:", ethers.formatUnits(feeData.gasPrice || BigInt(0), "gwei"), "gwei");
  console.log("");

  // ==================== Deploy CherryPickManager ====================
  console.log("📝 Deploying CherryPickManager...");
  const CherryPickManager = await ethers.getContractFactory("CherryPickManager");
  
  // Deploy with deployer as platform wallet
  const manager = await CherryPickManager.deploy(deployer.address);
  console.log("Transaction hash:", manager.deploymentTransaction()?.hash);
  console.log("Waiting for confirmations...");
  
  await manager.waitForDeployment();
  const managerAddress = await manager.getAddress();
  console.log("✅ CherryPickManager deployed to:", managerAddress);
  
  // Get deployment cost
  const deployTx = manager.deploymentTransaction();
  if (deployTx) {
    const receipt = await deployTx.wait();
    if (receipt) {
      const gasCost = receipt.gasUsed * (receipt.gasPrice || BigInt(0));
      console.log("   Gas used:", receipt.gasUsed.toString());
      console.log("   Deployment cost:", ethers.formatEther(gasCost), "ETH");
    }
  }

  // ==================== Deploy CherryPickNFT ====================
  console.log("\n🎨 Deploying CherryPickNFT...");
  const CherryPickNFT = await ethers.getContractFactory("CherryPickNFT");
  
  // Deploy with manager address
  const nft = await CherryPickNFT.deploy(managerAddress);
  console.log("Transaction hash:", nft.deploymentTransaction()?.hash);
  console.log("Waiting for confirmations...");
  
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("✅ CherryPickNFT deployed to:", nftAddress);
  
  // Get deployment cost
  const nftDeployTx = nft.deploymentTransaction();
  if (nftDeployTx) {
    const receipt = await nftDeployTx.wait();
    if (receipt) {
      const gasCost = receipt.gasUsed * (receipt.gasPrice || BigInt(0));
      console.log("   Gas used:", receipt.gasUsed.toString());
      console.log("   Deployment cost:", ethers.formatEther(gasCost), "ETH");
    }
  }

  // ==================== Setup Complete ====================
  console.log("\n" + "=".repeat(60));
  console.log("🎉 Deployment Complete!");
  console.log("=".repeat(60));
  
  // Determine network type
  const isMainnet = networkName === "base" || chainId === BigInt(8453);
  const networkType = isMainnet ? "mainnet" : "testnet";
  const explorerUrl = isMainnet ? "https://basescan.org" : "https://sepolia.basescan.org";
  
  // Print addresses
  console.log("\n📋 Contract Addresses:\n");
  console.log(`CherryPickManager: ${managerAddress}`);
  console.log(`CherryPickNFT:     ${nftAddress}`);
  
  // Update .env.local
  console.log("\n📝 Updating .env.local...");
  try {
    const envPath = path.join(__dirname, "..", ".env.local");
    let envContent = fs.readFileSync(envPath, "utf8");
    
    // Update or add contract addresses
    if (envContent.includes("NEXT_PUBLIC_CONTRACT_MANAGER_ADDRESS=")) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_CONTRACT_MANAGER_ADDRESS=.*/,
        `NEXT_PUBLIC_CONTRACT_MANAGER_ADDRESS=${managerAddress}`
      );
    } else {
      envContent += `\nNEXT_PUBLIC_CONTRACT_MANAGER_ADDRESS=${managerAddress}`;
    }
    
    if (envContent.includes("NEXT_PUBLIC_CROP_NFT_ADDRESS=")) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_CROP_NFT_ADDRESS=.*/,
        `NEXT_PUBLIC_CROP_NFT_ADDRESS=${nftAddress}`
      );
    } else {
      envContent += `\nNEXT_PUBLIC_CROP_NFT_ADDRESS=${nftAddress}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log("✅ .env.local updated with contract addresses");
  } catch (error) {
    console.log("⚠️  Could not update .env.local automatically. Please add manually:");
    console.log(`   NEXT_PUBLIC_CONTRACT_MANAGER_ADDRESS=${managerAddress}`);
    console.log(`   NEXT_PUBLIC_CROP_NFT_ADDRESS=${nftAddress}`);
  }
  
  // Print explorer links
  console.log("\n🔍 View contracts on BaseScan:");
  console.log(`   Manager: ${explorerUrl}/address/${managerAddress}`);
  console.log(`   NFT:     ${explorerUrl}/address/${nftAddress}`);
  
  // Print verification commands
  console.log("\n🔐 Verify contracts on BaseScan:");
  console.log(`   npx hardhat verify --network ${networkName} ${managerAddress} "${deployer.address}"`);
  console.log(`   npx hardhat verify --network ${networkName} ${nftAddress} "${managerAddress}"`);
  
  console.log("\n" + "=".repeat(60));
  
  if (isMainnet) {
    console.log("\n⚠️  MAINNET DEPLOYMENT COMPLETE!");
    console.log("⚠️  These contracts are now live on Base mainnet.");
    console.log("⚠️  Platform wallet set to:", deployer.address);
  } else {
    console.log("\n✅ TESTNET DEPLOYMENT COMPLETE!");
    console.log("💡 Test the contracts before deploying to mainnet.");
  }
  
  console.log("=".repeat(60) + "\n");
  
  // Return addresses for programmatic use
  return {
    manager: managerAddress,
    nft: nftAddress,
    network: networkType,
    deployer: deployer.address
  };
}

main()
  .then((result) => {
    console.log("Deployment result:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
