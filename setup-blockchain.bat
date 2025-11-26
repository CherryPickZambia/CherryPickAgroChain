@echo off
echo ========================================
echo AgroChain360 Blockchain Setup
echo ========================================
echo.

echo Step 1: Installing blockchain dependencies...
call npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts dotenv --legacy-peer-deps

echo.
echo Step 2: Initializing Hardhat...
if not exist "hardhat.config.ts" (
    echo Hardhat config already exists
)

echo.
echo Step 3: Creating contracts directory...
if not exist "contracts" mkdir contracts

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Get test ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
echo 2. Add your private key to .env.local
echo 3. Run: npm run compile
echo 4. Run: npm run deploy:testnet
echo.
pause
