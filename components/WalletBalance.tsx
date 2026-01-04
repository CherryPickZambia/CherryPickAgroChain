"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  ExternalLink,
  Copy,
  CheckCircle2,
  DollarSign,
  X,
  Shield,
  Mail,
  Phone,
  Twitter,
  Banknote
} from "lucide-react";
import toast from "react-hot-toast";
import { getUSDCBalance } from "@/lib/blockchain/contractInteractions";
import { useSendUserOperation, useCurrentUser, useEvmAddress } from "@coinbase/cdp-hooks";
import { supabase } from "@/lib/supabase";
import { encodeFunctionData } from "viem";

// USDC contract on Base Mainnet
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`;
const USDC_DECIMALS = 6;

// Base Mainnet configuration for CDP
const BASE_CHAIN_ID = 8453;
const BASE_NETWORK = "base" as const;

// Minimal ERC20 ABI for transfer
const ERC20_TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ type: "bool" }]
  }
] as const;

interface WalletBalanceProps {
  walletAddress: string;
  userRole: 'farmer' | 'officer' | 'buyer' | 'admin';
  userEmail?: string;
  userPhone?: string;
  userName?: string;
}

interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  created_at: string;
  notes: string;
}

export default function WalletBalance({ walletAddress, userRole, userEmail, userPhone, userName }: WalletBalanceProps) {
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [platformBalance, setPlatformBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState<'base' | 'pandora'>('base');
  const [withdrawing, setWithdrawing] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [copied, setCopied] = useState(false);

  // CDP hooks for user-signed transactions (Smart Accounts)
  const { sendUserOperation, data: txData } = useSendUserOperation();
  const { currentUser } = useCurrentUser();
  const { evmAddress } = useEvmAddress();

  // Load balances
  const loadBalances = async () => {
    setLoading(true);
    try {
      // Get on-chain USDC balance
      if (walletAddress && walletAddress.startsWith('0x')) {
        const balance = await getUSDCBalance(walletAddress as `0x${string}`);
        setUsdcBalance(balance);
      }

      // Get platform balance from database (payments received)
      if (supabase) {
        const { data: payments, error } = await supabase
          .from('payments')
          .select('*')
          .eq('user_wallet', walletAddress)
          .eq('status', 'completed')
          .order('created_at', { ascending: false });

        if (!error && payments) {
          // Calculate total platform balance
          const total = payments.reduce((sum: number, p: PaymentHistory) => sum + (p.amount || 0), 0);
          setPlatformBalance(total);
          setPaymentHistory(payments.slice(0, 5)); // Last 5 payments
        }
      }
    } catch (error) {
      console.error('Error loading balances:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      loadBalances();
    }
  }, [walletAddress]);

  // Copy wallet address
  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    toast.success('Wallet address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle withdraw - USER signs the transaction
  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (amount > usdcBalance) {
      toast.error('Insufficient balance');
      return;
    }

    // Check if user is signed in
    if (!currentUser) {
      toast.error('Please sign in to withdraw funds');
      return;
    }

    if (!evmAddress) {
      toast.error('Wallet not initialized. Please refresh and try again.');
      return;
    }

    // For Base network withdrawal - user signs USDC transfer
    if (withdrawMethod === 'base') {
      if (!withdrawAddress || !withdrawAddress.startsWith('0x')) {
        toast.error('Please enter a valid wallet address');
        return;
      }

      setWithdrawing(true);
      try {
        // Convert amount to USDC decimals (6)
        const amountInDecimals = BigInt(Math.floor(amount * Math.pow(10, USDC_DECIMALS)));
        
        // Encode the USDC transfer function call
        const transferData = encodeFunctionData({
          abi: ERC20_TRANSFER_ABI,
          functionName: 'transfer',
          args: [withdrawAddress as `0x${string}`, amountInDecimals],
        });

        // Debug: Log the account being used
        console.log('Attempting withdrawal with:', {
          evmAddress,
          walletAddress,
          currentUser: currentUser?.userId,
          evmAccounts: currentUser?.evmAccounts,
          network: BASE_NETWORK,
          chainId: BASE_CHAIN_ID,
        });

        // Get the smart account address from currentUser
        const smartAccount = currentUser?.evmSmartAccounts?.[0];
        
        if (!smartAccount) {
          throw new Error('Smart account not found. Please ensure you are signed in with a smart wallet.');
        }

        console.log('Using smart account:', smartAccount);
        console.log('Current user:', {
          userId: currentUser?.userId,
          evmAccounts: currentUser?.evmAccounts,
          evmSmartAccounts: currentUser?.evmSmartAccounts,
        });

        // User signs and sends the transaction via Smart Account (User Operation)
        const result = await sendUserOperation({
          evmSmartAccount: smartAccount,
          network: BASE_NETWORK,
          calls: [{
            to: USDC_ADDRESS,
            data: transferData,
            value: BigInt(0),
          }],
        });

        console.log('Withdrawal user operation hash:', result.userOperationHash);

        // Record in database
        if (supabase) {
          await supabase.from('payments').insert({
            user_wallet: walletAddress,
            amount: -amount,
            currency: 'USDC',
            type: 'withdrawal',
            status: 'completed',
            notes: `Withdrawal to ${withdrawAddress}`,
            metadata: {
              destination: withdrawAddress,
              method: 'base',
              txHash: result.userOperationHash,
            },
          });
        }

        toast.success(
          `✅ Withdrawal successful! $${amount} USDC sent to ${withdrawAddress.slice(0, 6)}...${withdrawAddress.slice(-4)}`,
          { duration: 5000 }
        );

        setShowWithdrawModal(false);
        setWithdrawAmount("");
        setWithdrawAddress("");
        loadBalances();
      } catch (error: any) {
        console.error('Withdrawal error:', error);
        toast.error(error.message || 'Withdrawal failed. Please try again.');
      } finally {
        setWithdrawing(false);
      }
    } else {
      // Pandora off-ramp - placeholder for now
      if (!withdrawAddress) {
        toast.error('Please enter your mobile number or Pandora ID');
        return;
      }

      setWithdrawing(true);
      try {
        // Record Pandora withdrawal request
        if (supabase) {
          await supabase.from('payments').insert({
            user_wallet: walletAddress,
            amount: -amount,
            currency: 'USDC',
            type: 'withdrawal',
            status: 'pending',
            notes: `Pandora off-ramp to ${withdrawAddress}`,
            metadata: {
              destination: withdrawAddress,
              method: 'pandora',
            },
          });
        }

        toast.success(
          `📱 Pandora withdrawal initiated! $${amount} USDC will be converted and sent to ${withdrawAddress}`,
          { duration: 5000 }
        );

        setShowWithdrawModal(false);
        setWithdrawAmount("");
        setWithdrawAddress("");
      } catch (error: any) {
        console.error('Pandora withdrawal error:', error);
        toast.error('Withdrawal failed. Please try again.');
      } finally {
        setWithdrawing(false);
      }
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">My Wallet</h3>
              <button 
                onClick={copyAddress}
                className="text-sm text-white/80 hover:text-white flex items-center gap-1 transition-colors"
              >
                {formatAddress(walletAddress)}
                {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>
          <button
            onClick={loadBalances}
            disabled={loading}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Balance Display - This is YOUR wallet */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-white/70" />
            <p className="text-white/70 text-sm">Your Balance (Withdrawable)</p>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">${usdcBalance.toFixed(2)}</span>
            <span className="text-white/80">USDC</span>
          </div>
          <p className="text-sm text-white/60 mt-2">
            This is your personal wallet. All earnings are deposited directly to you.
          </p>
          {platformBalance > 0 && (
            <p className="text-xs text-white/50 mt-1">
              Pending credits: ${platformBalance.toFixed(2)} USDC
            </p>
          )}
        </div>

        {/* Identity Linked */}
        {(userEmail || userPhone || userName) && (
          <div className="mb-4 p-3 bg-white/10 rounded-xl">
            <p className="text-xs text-white/60 mb-2">Wallet linked to:</p>
            <div className="flex flex-wrap gap-2">
              {userName && (
                <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                  <Twitter className="h-3 w-3" />
                  {userName}
                </span>
              )}
              {userEmail && (
                <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                  <Mail className="h-3 w-3" />
                  {userEmail.slice(0, 3)}...@{userEmail.split('@')[1]}
                </span>
              )}
              {userPhone && (
                <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                  <Phone className="h-3 w-3" />
                  {userPhone.slice(0, 4)}...{userPhone.slice(-2)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={!currentUser || !evmAddress || usdcBalance <= 0}
            className="flex items-center justify-center gap-2 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={!currentUser ? "Please sign in to withdraw" : !evmAddress ? "Wallet not initialized" : usdcBalance <= 0 ? "No balance to withdraw" : "Withdraw funds"}
          >
            <ArrowUpRight className="h-5 w-5" />
            <span className="font-medium">Withdraw</span>
          </button>
          <a
            href={`https://basescan.org/address/${walletAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
          >
            <ExternalLink className="h-5 w-5" />
            <span className="font-medium">View on Base</span>
          </a>
        </div>

        {/* Recent Payments */}
        {paymentHistory.length > 0 && (
          <div className="mt-6 pt-4 border-t border-white/20">
            <h4 className="text-sm font-medium text-white/80 mb-3">Recent Activity</h4>
            <div className="space-y-2">
              {paymentHistory.map((payment) => (
                <div 
                  key={payment.id}
                  className="flex items-center justify-between py-2 px-3 bg-white/10 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {payment.type === 'milestone_payment' ? (
                      <ArrowDownLeft className="h-4 w-4 text-green-300" />
                    ) : payment.type === 'verification_fee' ? (
                      <ArrowDownLeft className="h-4 w-4 text-blue-300" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-orange-300" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {payment.type === 'milestone_payment' ? 'Milestone Payment' :
                         payment.type === 'verification_fee' ? 'Verification Fee' :
                         'Withdrawal'}
                      </p>
                      <p className="text-xs text-white/60">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold ${payment.amount > 0 ? 'text-green-300' : 'text-orange-300'}`}>
                    {payment.amount > 0 ? '+' : ''}{payment.amount.toFixed(2)} USDC
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Withdraw USDC</h3>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Available Balance */}
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-emerald-600" />
                    <p className="text-sm text-emerald-700">Your Withdrawable Balance</p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-800">${usdcBalance.toFixed(2)} USDC</p>
                  <p className="text-xs text-emerald-600 mt-1">This is your money - withdraw anytime</p>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount to Withdraw
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-16 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => setWithdrawAmount(usdcBalance.toString())}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-emerald-600 font-medium hover:text-emerald-700"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                {/* Withdrawal Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Withdrawal Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setWithdrawMethod('base')}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        withdrawMethod === 'base'
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <ExternalLink className="h-4 w-4 text-blue-600" />
                        <p className="font-medium text-gray-900">External Wallet</p>
                      </div>
                      <p className="text-xs text-gray-500">Send to any Base wallet</p>
                      <p className="text-xs text-emerald-600 mt-1">Instant • No fees</p>
                    </button>
                    <button
                      onClick={() => setWithdrawMethod('pandora')}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        withdrawMethod === 'pandora'
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Banknote className="h-4 w-4 text-purple-600" />
                        <p className="font-medium text-gray-900">Pandora</p>
                      </div>
                      <p className="text-xs text-gray-500">Convert to mobile money</p>
                      <p className="text-xs text-purple-600 mt-1">MTN, Airtel, Bank</p>
                    </button>
                  </div>
                </div>

                {/* Destination Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {withdrawMethod === 'pandora' ? 'Mobile Number or Pandora ID' : 'Destination Wallet Address'}
                  </label>
                  <input
                    type="text"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder={withdrawMethod === 'pandora' ? '+260...' : '0x...'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  {withdrawMethod === 'pandora' && (
                    <p className="text-xs text-gray-500 mt-1">Enter your MTN/Airtel number or Pandora account ID</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing || !withdrawAmount || !withdrawAddress}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {withdrawing ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="h-5 w-5" />
                      Withdraw ${withdrawAmount || '0.00'} USDC
                    </>
                  )}
                </button>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700 text-center">
                    💡 This is YOUR wallet. Withdrawals go directly to you - not the platform.
                    {withdrawMethod === 'base' ? ' Instant transfer on Base network.' : ' Pandora converts to local currency.'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
