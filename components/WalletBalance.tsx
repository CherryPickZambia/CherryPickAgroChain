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
  Banknote,
  Building2,
  Smartphone,
  ChevronDown,
  Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import { getUSDCBalance } from "@/lib/blockchain/contractInteractions";
import { useSendUserOperation, useCurrentUser, useEvmAddress } from "@coinbase/cdp-hooks";
import { supabase } from "@/lib/supabase";
import { encodeFunctionData } from "viem";
import { lencoService, type Bank } from "@/lib/lenco-service";

// USDC contract on Base Mainnet
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`;
const USDC_DECIMALS = 6;
const BASE_NETWORK = "base" as const;

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

type WithdrawMethod = 'base' | 'mobile-money' | 'bank';
type DepositMethod = 'collect-momo' | 'transfer-bank' | 'transfer-momo';

export default function WalletBalance({ walletAddress, userRole, userEmail, userPhone, userName }: WalletBalanceProps) {
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [fiatBalance, setFiatBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState<WithdrawMethod>('mobile-money');
  const [withdrawing, setWithdrawing] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [copied, setCopied] = useState(false);

  // Mobile Money fields
  const [momoOperator, setMomoOperator] = useState<'airtel' | 'mtn' | 'zamtel'>('airtel');
  const [momoPhone, setMomoPhone] = useState("");

  // Bank fields
  const [bankList, setBankList] = useState<Bank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [loadingBanks, setLoadingBanks] = useState(false);

  // Deposit fields (admin only)
  const [depositMethod, setDepositMethod] = useState<DepositMethod>('collect-momo');
  const [depositAmount, setDepositAmount] = useState("");
  const [depositPhone, setDepositPhone] = useState("");
  const [depositOperator, setDepositOperator] = useState<'airtel' | 'mtn'>('airtel');
  const [depositing, setDepositing] = useState(false);

  const { sendUserOperation } = useSendUserOperation();
  const { currentUser } = useCurrentUser();
  const { evmAddress } = useEvmAddress();

  // Load balances
  const loadBalances = async () => {
    setLoading(true);
    try {
      if (walletAddress && walletAddress.startsWith('0x')) {
        const balance = await getUSDCBalance(walletAddress as `0x${string}`);
        setUsdcBalance(balance);
      }

      if (supabase) {
        const { data: payments, error } = await supabase
          .from('payments')
          .select('*')
          .eq('user_wallet', walletAddress)
          .eq('status', 'completed')
          .order('created_at', { ascending: false });

        if (!error && payments) {
          const fiatTotal = payments
            .filter((p: PaymentHistory) => p.currency === 'ZMW' || p.currency === 'KWA')
            .reduce((sum: number, p: PaymentHistory) => sum + (p.amount || 0), 0);
          setFiatBalance(fiatTotal);
          setPaymentHistory(payments.slice(0, 5));
        }
      }
    } catch (error) {
      console.error('Error loading balances:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) loadBalances();
  }, [walletAddress]);

  // Load bank list when bank withdrawal is selected
  useEffect(() => {
    if ((withdrawMethod === 'bank' || depositMethod === 'transfer-bank') && bankList.length === 0) {
      loadBankList();
    }
  }, [withdrawMethod, depositMethod]);

  const loadBankList = async () => {
    setLoadingBanks(true);
    try {
      const response = await lencoService.getBankList('zm');
      if (response.success && response.data?.data) {
        setBankList(response.data.data);
      }
    } catch (error) {
      console.error('Error loading banks:', error);
      // Fallback Zambian banks
      setBankList([
        { id: 'zanaco', name: 'Zanaco', country: 'zm' },
        { id: 'fnb', name: 'First National Bank Zambia', country: 'zm' },
        { id: 'stanbic', name: 'Stanbic Bank Zambia', country: 'zm' },
        { id: 'absa', name: 'ABSA Bank Zambia', country: 'zm' },
        { id: 'atlas', name: 'Atlas Mara Bank', country: 'zm' },
        { id: 'indo', name: 'Indo Zambia Bank', country: 'zm' },
      ]);
    } finally {
      setLoadingBanks(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    toast.success('Wallet address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // ─── WITHDRAW ────────────────────────────────────────────

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    const amount = parseFloat(withdrawAmount);

    setWithdrawing(true);
    try {
      if (withdrawMethod === 'base') {
        // ── Crypto: USDC transfer on Base ──
        if (amount > usdcBalance) { toast.error('Insufficient USDC balance'); setWithdrawing(false); return; }
        if (!withdrawAddress || !withdrawAddress.startsWith('0x')) { toast.error('Enter a valid 0x wallet address'); setWithdrawing(false); return; }
        if (!currentUser || !evmAddress) { toast.error('Please sign in first'); setWithdrawing(false); return; }

        const smartAccount = currentUser?.evmSmartAccounts?.[0];
        if (!smartAccount) throw new Error('Smart account not found');

        const amountInDecimals = BigInt(Math.floor(amount * Math.pow(10, USDC_DECIMALS)));
        const transferData = encodeFunctionData({
          abi: ERC20_TRANSFER_ABI,
          functionName: 'transfer',
          args: [withdrawAddress as `0x${string}`, amountInDecimals],
        });

        const result = await sendUserOperation({
          evmSmartAccount: smartAccount,
          network: BASE_NETWORK,
          calls: [{ to: USDC_ADDRESS, data: transferData, value: BigInt(0) }],
        });

        if (supabase) {
          await supabase.from('payments').insert({
            user_wallet: walletAddress, amount: -amount, currency: 'USDC', type: 'withdrawal',
            status: 'completed', notes: `USDC to ${withdrawAddress}`,
            metadata: { destination: withdrawAddress, method: 'base', txHash: result.userOperationHash },
          });
        }
        toast.success(`✅ Sent $${amount} USDC to ${formatAddress(withdrawAddress)}`, { duration: 5000 });

      } else if (withdrawMethod === 'mobile-money') {
        // ── Fiat: Mobile Money via Lenco ──
        if (amount > fiatBalance) { toast.error('Insufficient Kwacha balance'); setWithdrawing(false); return; }
        if (!momoPhone) { toast.error('Please enter a phone number'); setWithdrawing(false); return; }

        const result = await lencoService.sendMobileMoneyTransfer({
          amount,
          phone: momoPhone,
          network: momoOperator,
          accountName: userName || 'Withdrawal',
          reference: `WD-${Date.now()}`
        });

        if (supabase) {
          await supabase.from('payments').insert({
            user_wallet: walletAddress, amount: -amount, currency: 'ZMW', type: 'withdrawal',
            status: result.success ? 'completed' : 'pending',
            notes: `Mobile Money to ${momoPhone} (${momoOperator})`,
            metadata: { phone: momoPhone, operator: momoOperator, method: 'mobile-money', lencoData: result.data },
          });
        }
        toast.success(`📱 K${amount} sent to ${momoPhone} via ${momoOperator.toUpperCase()}`, { duration: 5000 });

      } else if (withdrawMethod === 'bank') {
        // ── Fiat: Bank Transfer via Lenco ──
        if (amount > fiatBalance) { toast.error('Insufficient Kwacha balance'); setWithdrawing(false); return; }
        if (!bankAccountNumber || !selectedBankId) { toast.error('Please fill in bank details'); setWithdrawing(false); return; }

        const reference = `BANK-${Date.now()}`;
        const result = await lencoService.sendBankTransfer({
          amount,
          accountNumber: bankAccountNumber,
          bankId: selectedBankId,
          narration: `Withdrawal - ${userName || 'User'}`,
          reference,
          country: 'zm'
        });

        if (supabase) {
          await supabase.from('payments').insert({
            user_wallet: walletAddress, amount: -amount, currency: 'ZMW', type: 'withdrawal',
            status: result.success ? 'completed' : 'pending',
            notes: `Bank transfer to ${bankAccountNumber}`,
            metadata: { accountNumber: bankAccountNumber, bankId: selectedBankId, method: 'bank', lencoData: result.data },
          });
        }
        const bankName = bankList.find(b => b.id === selectedBankId)?.name || selectedBankId;
        toast.success(`🏦 K${amount} sent to ${bankName} account`, { duration: 5000 });
      }

      setShowWithdrawModal(false);
      resetWithdrawForm();
      loadBalances();
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast.error(error.message || 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
    }
  };

  const resetWithdrawForm = () => {
    setWithdrawAmount("");
    setWithdrawAddress("");
    setMomoPhone("");
    setBankAccountNumber("");
    setSelectedBankId("");
  };

  // ─── DEPOSIT (Admin Only) ────────────────────────────────

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    const amount = parseFloat(depositAmount);

    setDepositing(true);
    try {
      if (depositMethod === 'collect-momo') {
        // Collect from customer phone via Lenco
        if (!depositPhone) { toast.error('Please enter a phone number'); setDepositing(false); return; }

        const result = await lencoService.collectMobileMoney({
          amount,
          phone: depositPhone,
          operator: depositOperator,
          reference: `COL-${Date.now()}`,
          country: 'zm',
          bearer: 'merchant'
        });

        toast.success(`📲 Payment request of K${amount} sent to ${depositPhone}. Customer must authorize on their phone.`, { duration: 6000 });

      } else if (depositMethod === 'transfer-bank') {
        // Transfer to a bank account
        if (!bankAccountNumber || !selectedBankId) { toast.error('Fill in bank details'); setDepositing(false); return; }

        const result = await lencoService.sendBankTransfer({
          amount,
          accountNumber: bankAccountNumber,
          bankId: selectedBankId,
          narration: 'Admin Deposit',
          reference: `DEP-BANK-${Date.now()}`,
          country: 'zm'
        });

        toast.success(`🏦 K${amount} transferred to bank account`, { duration: 5000 });

      } else if (depositMethod === 'transfer-momo') {
        // Transfer to a mobile money number
        if (!depositPhone) { toast.error('Please enter a phone number'); setDepositing(false); return; }

        const result = await lencoService.sendMobileMoneyTransfer({
          amount,
          phone: depositPhone,
          network: depositOperator,
          accountName: 'Admin Deposit',
          reference: `DEP-MOMO-${Date.now()}`
        });

        toast.success(`📱 K${amount} sent to ${depositPhone} via ${depositOperator.toUpperCase()}`, { duration: 5000 });
      }

      setShowDepositModal(false);
      setDepositAmount("");
      setDepositPhone("");
      loadBalances();
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast.error(error.message || 'Deposit failed');
    } finally {
      setDepositing(false);
    }
  };

  // ─── RENDER ──────────────────────────────────────────────

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

        {/* Dual Balance Display */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Crypto Balance */}
          <div className="bg-white/15 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Shield className="h-3.5 w-3.5 text-white/70" />
              <p className="text-white/70 text-xs">Crypto (USDC)</p>
            </div>
            <p className="text-2xl font-bold">${usdcBalance.toFixed(2)}</p>
            <p className="text-xs text-white/50 mt-1">Base Network</p>
          </div>
          {/* Fiat Balance */}
          <div className="bg-white/15 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Banknote className="h-3.5 w-3.5 text-white/70" />
              <p className="text-white/70 text-xs">Fiat (Kwacha)</p>
            </div>
            <p className="text-2xl font-bold">K{fiatBalance.toFixed(2)}</p>
            <p className="text-xs text-white/50 mt-1">Zambian Kwacha</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`grid ${userRole === 'admin' ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="flex items-center justify-center gap-2 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
          >
            <ArrowUpRight className="h-5 w-5" />
            <span className="font-medium">Withdraw</span>
          </button>
          {userRole === 'admin' && (
            <button
              onClick={() => setShowDepositModal(true)}
              className="flex items-center justify-center gap-2 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
            >
              <ArrowDownLeft className="h-5 w-5" />
              <span className="font-medium">Deposit</span>
            </button>
          )}
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

        {/* Recent Activity */}
        {paymentHistory.length > 0 && (
          <div className="mt-6 pt-4 border-t border-white/20">
            <h4 className="text-sm font-medium text-white/80 mb-3">Recent Activity</h4>
            <div className="space-y-2">
              {paymentHistory.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-2 px-3 bg-white/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    {payment.amount > 0 ? (
                      <ArrowDownLeft className="h-4 w-4 text-green-300" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-orange-300" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {payment.type === 'milestone_payment' ? 'Milestone Payment' :
                          payment.type === 'verification_fee' ? 'Verification Fee' :
                            payment.type === 'withdrawal' ? 'Withdrawal' : payment.type}
                      </p>
                      <p className="text-xs text-white/60">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold ${payment.amount > 0 ? 'text-green-300' : 'text-orange-300'}`}>
                    {payment.amount > 0 ? '+' : ''}{payment.currency === 'ZMW' ? 'K' : '$'}{Math.abs(payment.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* ─── WITHDRAW MODAL ──────────────────────────────── */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Withdraw Funds</h3>
                <button onClick={() => { setShowWithdrawModal(false); resetWithdrawForm(); }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Balances Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <p className="text-xs text-blue-600 mb-1">Crypto (USDC)</p>
                    <p className="text-lg font-bold text-blue-800">${usdcBalance.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl">
                    <p className="text-xs text-emerald-600 mb-1">Fiat (Kwacha)</p>
                    <p className="text-lg font-bold text-emerald-800">K{fiatBalance.toFixed(2)}</p>
                  </div>
                </div>

                {/* Withdrawal Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setWithdrawMethod('mobile-money')}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${withdrawMethod === 'mobile-money' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <Smartphone className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
                      <p className="text-xs font-medium text-gray-900">Mobile Money</p>
                      <p className="text-[10px] text-gray-500">Kwacha</p>
                    </button>
                    <button
                      onClick={() => setWithdrawMethod('bank')}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${withdrawMethod === 'bank' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <Building2 className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                      <p className="text-xs font-medium text-gray-900">Bank</p>
                      <p className="text-[10px] text-gray-500">Kwacha</p>
                    </button>
                    <button
                      onClick={() => setWithdrawMethod('base')}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${withdrawMethod === 'base' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <ExternalLink className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                      <p className="text-xs font-medium text-gray-900">Crypto</p>
                      <p className="text-[10px] text-gray-500">USDC</p>
                    </button>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                      {withdrawMethod === 'base' ? '$' : 'K'}
                    </span>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-16 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => setWithdrawAmount(withdrawMethod === 'base' ? usdcBalance.toString() : fiatBalance.toString())}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-emerald-600 font-medium hover:text-emerald-700"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                {/* ── Mobile Money Fields ── */}
                {withdrawMethod === 'mobile-money' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Network</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['airtel', 'mtn', 'zamtel'] as const).map(op => (
                          <button
                            key={op}
                            onClick={() => setMomoOperator(op)}
                            className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${momoOperator === op ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                          >
                            {op.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="text"
                        value={momoPhone}
                        onChange={(e) => setMomoPhone(e.target.value)}
                        placeholder="+260977123456"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                {/* ── Bank Fields ── */}
                {withdrawMethod === 'bank' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bank</label>
                      {loadingBanks ? (
                        <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading banks...
                        </div>
                      ) : (
                        <select
                          value={selectedBankId}
                          onChange={(e) => setSelectedBankId(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                        >
                          <option value="">Select a bank</option>
                          {bankList.map(bank => (
                            <option key={bank.id} value={bank.id}>{bank.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                      <input
                        type="text"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                        placeholder="Enter account number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                {/* ── Crypto Fields ── */}
                {withdrawMethod === 'base' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Destination Wallet Address</label>
                    <input
                      type="text"
                      value={withdrawAddress}
                      onChange={(e) => setWithdrawAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing || !withdrawAmount}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {withdrawing ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
                  ) : (
                    <><ArrowUpRight className="h-5 w-5" /> Withdraw {withdrawMethod === 'base' ? `$${withdrawAmount || '0.00'} USDC` : `K${withdrawAmount || '0.00'}`}</>
                  )}
                </button>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700 text-center">
                    {withdrawMethod === 'base' ? '💡 USDC withdrawn directly from your Base wallet.' :
                      withdrawMethod === 'mobile-money' ? '💡 Kwacha sent to your mobile money account via Lenco.' :
                        '💡 Kwacha sent to your bank account via Lenco.'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── DEPOSIT MODAL (Admin Only) ──────────────────── */}
      <AnimatePresence>
        {showDepositModal && userRole === 'admin' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Send / Deposit</h3>
                <button onClick={() => setShowDepositModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Deposit Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setDepositMethod('collect-momo')}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${depositMethod === 'collect-momo' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <ArrowDownLeft className="h-5 w-5 mx-auto mb-1 text-green-600" />
                      <p className="text-xs font-medium text-gray-900">Collect MoMo</p>
                      <p className="text-[10px] text-gray-500">Request pay</p>
                    </button>
                    <button
                      onClick={() => setDepositMethod('transfer-momo')}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${depositMethod === 'transfer-momo' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <Smartphone className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                      <p className="text-xs font-medium text-gray-900">Send MoMo</p>
                      <p className="text-[10px] text-gray-500">To phone</p>
                    </button>
                    <button
                      onClick={() => setDepositMethod('transfer-bank')}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${depositMethod === 'transfer-bank' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <Building2 className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                      <p className="text-xs font-medium text-gray-900">Send Bank</p>
                      <p className="text-[10px] text-gray-500">To account</p>
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (Kwacha)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">K</span>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Mobile Money fields (for collect & transfer-momo) */}
                {(depositMethod === 'collect-momo' || depositMethod === 'transfer-momo') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Network</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['airtel', 'mtn'] as const).map(op => (
                          <button
                            key={op}
                            onClick={() => setDepositOperator(op)}
                            className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${depositOperator === op ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                          >
                            {op.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="text"
                        value={depositPhone}
                        onChange={(e) => setDepositPhone(e.target.value)}
                        placeholder="+260977123456"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                {/* Bank fields (for transfer-bank) */}
                {depositMethod === 'transfer-bank' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bank</label>
                      {loadingBanks ? (
                        <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading banks...
                        </div>
                      ) : (
                        <select
                          value={selectedBankId}
                          onChange={(e) => setSelectedBankId(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                        >
                          <option value="">Select a bank</option>
                          {bankList.map(bank => (
                            <option key={bank.id} value={bank.id}>{bank.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                      <input
                        type="text"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                        placeholder="Enter account number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                {/* Submit */}
                <button
                  onClick={handleDeposit}
                  disabled={depositing || !depositAmount}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {depositing ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
                  ) : (
                    <>{depositMethod === 'collect-momo' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                      {depositMethod === 'collect-momo' ? `Request K${depositAmount || '0.00'}` : `Send K${depositAmount || '0.00'}`}
                    </>
                  )}
                </button>

                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-xs text-amber-700 text-center">
                    {depositMethod === 'collect-momo' ? '📲 The customer will receive a prompt on their phone to authorize payment.' :
                      depositMethod === 'transfer-momo' ? '📱 Funds will be sent to the mobile money number via Lenco.' :
                        '🏦 Funds will be transferred to the bank account via Lenco.'}
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
