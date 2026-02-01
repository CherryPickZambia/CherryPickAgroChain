const hre = require("hardhat");

async function main() {
    const ethers = hre.ethers;
    console.log("🚀 Deploying AgrochainMarketplace (USDC Version)...");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Configuration
    const INITIAL_FEE_BPS = 500; // 5%
    const FEE_TREASURY = deployer.address;

    // Base Mainnet USDC Address
    const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

    console.log("Configuration:");
    console.log(" - USDC:", USDC_ADDRESS);
    console.log(" - Fee Treasury:", FEE_TREASURY);
    console.log(" - Initial Fee:", "5%");

    const Marketplace = await ethers.getContractFactory("AgrochainMarketplace");
    const marketplace = await Marketplace.deploy(FEE_TREASURY, INITIAL_FEE_BPS, USDC_ADDRESS);

    await marketplace.waitForDeployment();

    const address = await marketplace.getAddress();
    console.log("\n✅ AgrochainMarketplace deployed to:", address);

    // Verification instruction
    console.log("\nTo verify on Etherscan:");
    console.log(`npx hardhat verify --network base ${address} "${FEE_TREASURY}" ${INITIAL_FEE_BPS} "${USDC_ADDRESS}"`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
