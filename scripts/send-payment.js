const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.local' });

async function main() {
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    const RPC_URL = process.env.BASE_MAINNET_RPC_URL || 'https://mainnet.base.org';
    const RECIPIENT = '0xd81037D3Bde4d1861748379edb4A5E68D6d874fB';
    const AMOUNT = '0.03';
    // Base Mainnet USDC Address
    const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

    if (!PRIVATE_KEY) {
        throw new Error('PRIVATE_KEY not found in .env.local');
    }

    // Connect to provider and wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log(`Using wallet: ${wallet.address}`);

    // ERC20 Minimal ABI
    const abi = [
        "function transfer(address to, uint256 amount) returns (bool)",
        "function decimals() view returns (uint8)",
        "function balanceOf(address owner) view returns (uint256)"
    ];

    const usdc = new ethers.Contract(USDC_ADDRESS, abi, wallet);

    // Check balance
    const decimals = await usdc.decimals();
    const balance = await usdc.balanceOf(wallet.address);
    const formattedBalance = ethers.formatUnits(balance, decimals);

    console.log(`USDC Balance: ${formattedBalance}`);

    if (parseFloat(formattedBalance) < parseFloat(AMOUNT)) {
        throw new Error(`Insufficient USDC balance. Have ${formattedBalance}, need ${AMOUNT}`);
    }

    // Send transaction
    const amountToSend = ethers.parseUnits(AMOUNT, decimals);
    console.log(`Sending ${AMOUNT} USDC to ${RECIPIENT}...`);

    const tx = await usdc.transfer(RECIPIENT, amountToSend);
    console.log(`Transaction submitted! Hash: ${tx.hash}`);

    console.log(`Waiting for confirmation...`);
    await tx.wait();
    console.log(`Transaction confirmed!`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
