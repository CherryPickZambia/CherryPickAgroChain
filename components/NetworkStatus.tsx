"use client";

import { useState, useEffect } from "react";
import { 
  getNetworkStatus, 
  getGasEstimates, 
  getNetworkComparison,
  type NetworkStatus as NetworkStatusType,
  type GasEstimate
} from "@/lib/blockchain/networkStatus";
import { Wifi, WifiOff, Fuel, Activity, TrendingDown, RefreshCw, ExternalLink } from "lucide-react";

interface NetworkStatusProps {
  compact?: boolean;
  showComparison?: boolean;
}

export default function NetworkStatus({ compact = false, showComparison = true }: NetworkStatusProps) {
  const [status, setStatus] = useState<NetworkStatusType | null>(null);
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null);
  const [comparison, setComparison] = useState<{
    base: { gasPrice: string; transferCost: string };
    ethereumEstimate: { gasPrice: string; transferCost: string };
    savings: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchNetworkData = async () => {
    setLoading(true);
    try {
      const [networkStatus, gas, comp] = await Promise.all([
        getNetworkStatus(),
        getGasEstimates(),
        showComparison ? getNetworkComparison() : Promise.resolve(null),
      ]);
      
      setStatus(networkStatus);
      setGasEstimate(gas);
      if (comp) setComparison(comp);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to fetch network data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNetworkData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchNetworkData, 30000);
    return () => clearInterval(interval);
  }, [showComparison]);

  const getGasLevelColor = (gwei: string) => {
    const value = parseFloat(gwei);
    if (value < 0.01) return "text-green-500";
    if (value < 0.1) return "text-green-400";
    if (value < 1) return "text-yellow-500";
    if (value < 10) return "text-orange-500";
    return "text-red-500";
  };

  const getGasLevelBg = (gwei: string) => {
    const value = parseFloat(gwei);
    if (value < 0.1) return "bg-green-500/10 border-green-500/20";
    if (value < 1) return "bg-yellow-500/10 border-yellow-500/20";
    return "bg-orange-500/10 border-orange-500/20";
  };

  const getGasLevelLabel = (gwei: string) => {
    const value = parseFloat(gwei);
    if (value < 0.01) return "Ultra Low";
    if (value < 0.1) return "Very Low";
    if (value < 1) return "Low";
    if (value < 10) return "Medium";
    return "High";
  };

  // Compact version for header
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        {status?.isConnected ? (
          <>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-gray-600 hidden sm:inline">Base</span>
            </div>
            <div className={`flex items-center gap-1 ${getGasLevelColor(status.gasPrice.gwei)}`}>
              <Fuel className="w-3 h-3" />
              <span className="font-medium">{parseFloat(status.gasPrice.gwei).toFixed(4)}</span>
              <span className="text-gray-400 text-xs">gwei</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1 text-red-500">
            <WifiOff className="w-3 h-3" />
            <span>Offline</span>
          </div>
        )}
      </div>
    );
  }

  // Full version
  return (
    <div className="card-premium">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${status?.isConnected ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            {status?.isConnected ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-[#1a1a1a]">Base Network Status</h3>
            <p className="text-sm text-gray-500">
              {status?.network || "Checking..."}
            </p>
          </div>
        </div>
        <button
          onClick={fetchNetworkData}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !status ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2d5f3f]"></div>
        </div>
      ) : status ? (
        <>
          {/* Gas Price Card */}
          <div className={`rounded-xl p-4 mb-4 border ${getGasLevelBg(status.gasPrice.gwei)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Fuel className={`w-5 h-5 ${getGasLevelColor(status.gasPrice.gwei)}`} />
                <span className="font-medium text-gray-700">Current Gas Price</span>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getGasLevelColor(status.gasPrice.gwei)} ${getGasLevelBg(status.gasPrice.gwei)}`}>
                {getGasLevelLabel(status.gasPrice.gwei)}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${getGasLevelColor(status.gasPrice.gwei)}`}>
                {parseFloat(status.gasPrice.gwei).toFixed(6)}
              </span>
              <span className="text-gray-500">gwei</span>
            </div>
            {status.baseFee && (
              <p className="text-sm text-gray-500 mt-1">
                Base fee: {parseFloat(status.baseFee).toFixed(6)} gwei
              </p>
            )}
          </div>

          {/* Gas Estimates */}
          {gasEstimate && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Slow</p>
                <p className="font-semibold text-gray-700">{parseFloat(gasEstimate.slow).toFixed(4)}</p>
                <p className="text-xs text-gray-400">gwei</p>
              </div>
              <div className="bg-[#f0f7f4] rounded-lg p-3 text-center border border-[#2d5f3f]/20">
                <p className="text-xs text-[#2d5f3f] mb-1">Standard</p>
                <p className="font-semibold text-[#2d5f3f]">{parseFloat(gasEstimate.standard).toFixed(4)}</p>
                <p className="text-xs text-[#2d5f3f]/60">gwei</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Fast</p>
                <p className="font-semibold text-gray-700">{parseFloat(gasEstimate.fast).toFixed(4)}</p>
                <p className="text-xs text-gray-400">gwei</p>
              </div>
            </div>
          )}

          {/* Estimated Costs */}
          {gasEstimate && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Estimated Transaction Costs</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ETH Transfer</span>
                  <span className="font-medium text-gray-700">
                    {parseFloat(gasEstimate.estimatedCost.transfer).toFixed(8)} ETH
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Contract Call (avg)</span>
                  <span className="font-medium text-gray-700">
                    {parseFloat(gasEstimate.estimatedCost.contractCall).toFixed(8)} ETH
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Savings Comparison */}
          {showComparison && comparison && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-4 border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Base vs Ethereum Mainnet</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Base</p>
                  <p className="font-bold text-green-600">{comparison.base.gasPrice}</p>
                  <p className="text-xs text-gray-500">{comparison.base.transferCost}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Ethereum</p>
                  <p className="font-bold text-gray-600">{comparison.ethereumEstimate.gasPrice}</p>
                  <p className="text-xs text-gray-500">{comparison.ethereumEstimate.transferCost}</p>
                </div>
              </div>
              <div className="text-center py-2 bg-green-100 rounded-lg">
                <span className="font-bold text-green-700">{comparison.savings}</span>
              </div>
            </div>
          )}

          {/* Network Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Block</span>
              </div>
              <p className="font-semibold text-gray-700">
                #{status.blockNumber.toString()}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Wifi className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Latency</span>
              </div>
              <p className="font-semibold text-gray-700">{status.latency}ms</p>
            </div>
          </div>

          {/* Explorer Link */}
          <a
            href={status.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 text-sm text-[#2d5f3f] hover:text-[#1d4029] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View on BaseScan</span>
          </a>

          {/* Last Updated */}
          {lastUpdate && (
            <p className="text-xs text-gray-400 text-center mt-3">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-red-500">
          <WifiOff className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Unable to connect to Base network</p>
          <button
            onClick={fetchNetworkData}
            className="mt-3 text-sm text-[#2d5f3f] hover:underline"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
