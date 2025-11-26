/**
 * Smart Contract Configuration for AgroChain360
 * Manages contract addresses and ABIs for Base network
 */

export const CONTRACTS = {
  // Base Sepolia (Testnet)
  baseSepolia: {
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
    explorer: 'https://sepolia.basescan.org',
    contracts: {
      AgroChain360Manager: {
        address: process.env.NEXT_PUBLIC_CONTRACT_MANAGER_ADDRESS || '',
        deployedBlock: 0,
      },
      CropJourneyNFT: {
        address: process.env.NEXT_PUBLIC_CROP_NFT_ADDRESS || '',
        deployedBlock: 0,
      },
    },
  },
  // Base Mainnet
  base: {
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
    contracts: {
      AgroChain360Manager: {
        address: process.env.NEXT_PUBLIC_CONTRACT_MANAGER_ADDRESS || '',
        deployedBlock: 0,
      },
      CropJourneyNFT: {
        address: process.env.NEXT_PUBLIC_CROP_NFT_ADDRESS || '',
        deployedBlock: 0,
      },
    },
  },
};

// Current network (change based on environment)
export const CURRENT_NETWORK = process.env.NEXT_PUBLIC_NETWORK === 'mainnet' ? 'base' : 'baseSepolia';

export const getContractAddress = (contractName: 'AgroChain360Manager' | 'CropJourneyNFT') => {
  return CONTRACTS[CURRENT_NETWORK].contracts[contractName].address;
};

export const getChainId = () => {
  return CONTRACTS[CURRENT_NETWORK].chainId;
};

export const getExplorerUrl = () => {
  return CONTRACTS[CURRENT_NETWORK].explorer;
};

export const getRpcUrl = () => {
  return CONTRACTS[CURRENT_NETWORK].rpcUrl;
};
