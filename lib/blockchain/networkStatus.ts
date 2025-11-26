/**
 * Network Status Service
 * Check Base network health, gas prices, and RPC status
 */

import { createPublicClient, http, formatGwei, formatEther } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { CONTRACTS, CURRENT_NETWORK, getRpcUrl } from './contractConfig';

const chain = CURRENT_NETWORK === 'base' ? base : baseSepolia;

// Create public client with custom RPC
export const networkClient = createPublicClient({
  chain,
  transport: http(getRpcUrl()),
});

export interface NetworkStatus {
  isConnected: boolean;
  network: string;
  chainId: number;
  blockNumber: bigint;
  gasPrice: {
    wei: bigint;
    gwei: string;
    eth: string;
  };
  baseFee: string | null;
  timestamp: number;
  rpcUrl: string;
  explorerUrl: string;
  latency: number;
}

export interface GasEstimate {
  slow: string;
  standard: string;
  fast: string;
  estimatedCost: {
    transfer: string;
    contractCall: string;
  };
}

/**
 * Get current network status and health
 */
export async function getNetworkStatus(): Promise<NetworkStatus> {
  const startTime = Date.now();
  
  try {
    const [blockNumber, gasPrice, block] = await Promise.all([
      networkClient.getBlockNumber(),
      networkClient.getGasPrice(),
      networkClient.getBlock({ blockTag: 'latest' }),
    ]);
    
    const latency = Date.now() - startTime;
    const config = CONTRACTS[CURRENT_NETWORK];
    
    return {
      isConnected: true,
      network: CURRENT_NETWORK === 'base' ? 'Base Mainnet' : 'Base Sepolia (Testnet)',
      chainId: config.chainId,
      blockNumber,
      gasPrice: {
        wei: gasPrice,
        gwei: formatGwei(gasPrice),
        eth: formatEther(gasPrice),
      },
      baseFee: block.baseFeePerGas ? formatGwei(block.baseFeePerGas) : null,
      timestamp: Date.now(),
      rpcUrl: config.rpcUrl,
      explorerUrl: config.explorer,
      latency,
    };
  } catch (error) {
    console.error('Network status check failed:', error);
    const config = CONTRACTS[CURRENT_NETWORK];
    
    return {
      isConnected: false,
      network: CURRENT_NETWORK === 'base' ? 'Base Mainnet' : 'Base Sepolia (Testnet)',
      chainId: config.chainId,
      blockNumber: BigInt(0),
      gasPrice: {
        wei: BigInt(0),
        gwei: '0',
        eth: '0',
      },
      baseFee: null,
      timestamp: Date.now(),
      rpcUrl: config.rpcUrl,
      explorerUrl: config.explorer,
      latency: Date.now() - startTime,
    };
  }
}

/**
 * Get gas price estimates (slow, standard, fast)
 */
export async function getGasEstimates(): Promise<GasEstimate> {
  try {
    const gasPrice = await networkClient.getGasPrice();
    
    // Base has very low gas - calculate tiers
    const slow = gasPrice;
    const standard = (gasPrice * BigInt(110)) / BigInt(100); // +10%
    const fast = (gasPrice * BigInt(125)) / BigInt(100); // +25%
    
    // Estimate costs for common operations
    const transferGas = BigInt(21000); // Simple ETH transfer
    const contractCallGas = BigInt(100000); // Average contract call
    
    return {
      slow: formatGwei(slow),
      standard: formatGwei(standard),
      fast: formatGwei(fast),
      estimatedCost: {
        transfer: formatEther(standard * transferGas),
        contractCall: formatEther(standard * contractCallGas),
      },
    };
  } catch (error) {
    console.error('Gas estimate failed:', error);
    return {
      slow: '0.001',
      standard: '0.001',
      fast: '0.002',
      estimatedCost: {
        transfer: '0.000021',
        contractCall: '0.0001',
      },
    };
  }
}

/**
 * Check if RPC is healthy and responsive
 */
export async function checkRpcHealth(): Promise<{
  healthy: boolean;
  latency: number;
  blocksBehind: number;
}> {
  const startTime = Date.now();
  
  try {
    const blockNumber = await networkClient.getBlockNumber();
    const latency = Date.now() - startTime;
    
    // Check if we're reasonably up to date (Base produces blocks every ~2 seconds)
    // If latency is high, we might be behind
    const estimatedBlocksBehind = Math.floor(latency / 2000);
    
    return {
      healthy: latency < 5000, // Consider unhealthy if >5s latency
      latency,
      blocksBehind: estimatedBlocksBehind,
    };
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - startTime,
      blocksBehind: -1,
    };
  }
}

/**
 * Get account balance on Base network
 */
export async function getAccountBalance(address: `0x${string}`): Promise<{
  wei: bigint;
  eth: string;
  formatted: string;
}> {
  try {
    const balance = await networkClient.getBalance({ address });
    const ethBalance = formatEther(balance);
    
    return {
      wei: balance,
      eth: ethBalance,
      formatted: `${parseFloat(ethBalance).toFixed(6)} ETH`,
    };
  } catch (error) {
    console.error('Balance check failed:', error);
    return {
      wei: BigInt(0),
      eth: '0',
      formatted: '0 ETH',
    };
  }
}

/**
 * Estimate transaction cost
 */
export async function estimateTransactionCost(
  gasLimit: bigint
): Promise<{
  wei: bigint;
  eth: string;
  usd: string; // Estimated at ~$2500/ETH
}> {
  try {
    const gasPrice = await networkClient.getGasPrice();
    const totalCost = gasPrice * gasLimit;
    const ethCost = formatEther(totalCost);
    const usdCost = (parseFloat(ethCost) * 2500).toFixed(4);
    
    return {
      wei: totalCost,
      eth: ethCost,
      usd: `$${usdCost}`,
    };
  } catch (error) {
    return {
      wei: BigInt(0),
      eth: '0',
      usd: '$0',
    };
  }
}

/**
 * Watch for new blocks (useful for real-time updates)
 */
export function watchBlocks(callback: (blockNumber: bigint) => void) {
  return networkClient.watchBlockNumber({
    onBlockNumber: callback,
  });
}

/**
 * Get network comparison (for displaying how cheap Base is)
 */
export async function getNetworkComparison(): Promise<{
  base: { gasPrice: string; transferCost: string };
  ethereumEstimate: { gasPrice: string; transferCost: string };
  savings: string;
}> {
  try {
    const gasPrice = await networkClient.getGasPrice();
    const transferGas = BigInt(21000);
    
    // Base gas price
    const baseCost = gasPrice * transferGas;
    const baseGwei = formatGwei(gasPrice);
    
    // Ethereum average estimate (~30 gwei typically)
    const ethGasPrice = BigInt(30000000000); // 30 gwei
    const ethCost = ethGasPrice * transferGas;
    
    const savingsPercent = ((Number(ethCost - baseCost) / Number(ethCost)) * 100).toFixed(1);
    
    return {
      base: {
        gasPrice: `${baseGwei} gwei`,
        transferCost: `${formatEther(baseCost)} ETH`,
      },
      ethereumEstimate: {
        gasPrice: '30 gwei',
        transferCost: `${formatEther(ethCost)} ETH`,
      },
      savings: `${savingsPercent}% cheaper on Base`,
    };
  } catch (error) {
    return {
      base: { gasPrice: '0.001 gwei', transferCost: '~$0.001' },
      ethereumEstimate: { gasPrice: '30 gwei', transferCost: '~$1.50' },
      savings: '99%+ cheaper on Base',
    };
  }
}

/**
 * Format network status for display
 */
export function formatNetworkStatusDisplay(status: NetworkStatus): string {
  if (!status.isConnected) {
    return '🔴 Disconnected from Base Network';
  }
  
  const gasCost = parseFloat(status.gasPrice.gwei);
  let gasIndicator = '🟢';
  let gasLevel = 'Ultra Low';
  
  if (gasCost > 0.1) {
    gasIndicator = '🟡';
    gasLevel = 'Low';
  }
  if (gasCost > 1) {
    gasIndicator = '🟠';
    gasLevel = 'Medium';
  }
  if (gasCost > 10) {
    gasIndicator = '🔴';
    gasLevel = 'High';
  }
  
  return `${gasIndicator} ${status.network} | Gas: ${status.gasPrice.gwei} gwei (${gasLevel}) | Block: ${status.blockNumber.toString()} | Latency: ${status.latency}ms`;
}
