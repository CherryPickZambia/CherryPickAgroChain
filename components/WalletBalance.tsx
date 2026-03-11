"use client";

import { useState, useEffect, useCallback } from "react";
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
  Loader2,
  CreditCard
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
  type?: string | null;
  payment_type?: string | null;
  status: string;
  created_at: string;
  to_address?: string;
  from_address?: string;
  transaction_hash?: string;
}

type WithdrawMethod = 'base' | 'mobile-money' | 'bank';
type DepositMethod = 'collect-momo' | 'deposit-card';

const SETTLED_PAYMENT_STATUSES = ['confirmed', 'completed'] as const;

const isSettledPaymentStatus = (status?: string | null) => {
  if (!status) return false;
  return SETTLED_PAYMENT_STATUSES.includes(status.toLowerCase() as (typeof SETTLED_PAYMENT_STATUSES)[number]);
};

const normalizePaymentStatus = (status?: string | null) => {
  const normalized = status?.toLowerCase();

  if (!normalized) return 'pending';
  if (normalized === 'confirmed' || normalized === 'completed' || normalized === 'success' || normalized === 'successful') {
    return 'confirmed';
  }
  if (normalized === 'failed' || normalized === 'cancelled' || normalized === 'rejected') {
    return 'failed';
  }

  return 'pending';
};

const isFiatCurrency = (currency?: string | null) => {
  return currency === 'ZMW' || currency === 'KWA';
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function WalletBalance({ walletAddress, userRole, userEmail, userPhone, userName }: WalletBalanceProps) {
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [fiatBalance, setFiatBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
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

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositMethod, setDepositMethod] = useState<'collect-momo' | 'deposit-card'>('collect-momo');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositOperator, setDepositOperator] = useState<'mtn' | 'airtel'>('mtn');
  const [depositPhone, setDepositPhone] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [depositing, setDepositing] = useState(false);

  const { sendUserOperation } = useSendUserOperation();
  const { currentUser } = useCurrentUser();
  const { evmAddress } = useEvmAddress();

  const isIncomingPayment = useCallback((payment: PaymentHistory) => {
    if (payment.to_address === walletAddress) return true;
    if (payment.from_address === walletAddress) return false;
    return payment.amount >= 0;
  }, [walletAddress]);

  const normalizePaymentRecord = useCallback((payment: Record<string, any>): PaymentHistory => {
    const rawAmount = Number(payment.amount || 0);

    return {
      id: payment.id,
      amount: rawAmount,
      currency: payment.currency || 'ZMW',
      type: payment.payment_type || null,
      payment_type: payment.payment_type || null,
      status: payment.status || 'pending',
      created_at: payment.created_at || new Date().toISOString(),
      to_address: payment.to_address,
      from_address: payment.from_address,
      transaction_hash: payment.transaction_hash,
    };
  }, []);

  const loadBalances = useCallback(async () => {
    setLoading(true);
    try {
      if (walletAddress && walletAddress.startsWith('0x')) {
        const balance = await getUSDCBalance(walletAddress as `0x${string}`);
        setUsdcBalance(balance);
      }

      if (supabase) {
        // Query all payment statuses to show history, but only count settled ones for balance
        const QUERY_STATUSES = ['confirmed', 'completed', 'pending', 'processing'];
        const { data: walletPayments, error } = await supabase
          .from('payments')
          .select('*')
          .or(`to_address.eq.${walletAddress},from_address.eq.${walletAddress}`)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Supabase load payments error:", error);
        }

        const mergedPayments: PaymentHistory[] = (walletPayments || [])
          .map((payment: Record<string, any>) => normalizePaymentRecord(payment))
          .filter((payment: PaymentHistory, index: number, array: PaymentHistory[]) => array.findIndex((candidate: PaymentHistory) => candidate.id === payment.id) === index)
          .sort((left: PaymentHistory, right: PaymentHistory) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());

        // Calculate fiat balance from settled payments only
        const fiatTotal = mergedPayments.reduce((sum: number, payment: PaymentHistory) => {
          if (!isFiatCurrency(payment.currency) || !isSettledPaymentStatus(payment.status)) {
            return sum;
          }

          return sum + (isIncomingPayment(payment) ? Math.abs(payment.amount || 0) : -Math.abs(payment.amount || 0));
        }, 0);

        // Also count pending deposits so users see expected balance
        const pendingDeposits = mergedPayments.reduce((sum: number, payment: PaymentHistory) => {
          if (!isFiatCurrency(payment.currency)) return sum;
          const status = (payment.status || '').toLowerCase();
          if ((status === 'pending' || status === 'processing') && isIncomingPayment(payment)) {
            return sum + Math.abs(payment.amount || 0);
          }
          return sum;
        }, 0);

        setFiatBalance(fiatTotal + pendingDeposits);
        setPaymentHistory(mergedPayments.slice(0, 10));
      }
    } catch (error) {
      console.error('Error loading balances:', error);
    } finally {
      setLoading(false);
    }
  }, [isIncomingPayment, normalizePaymentRecord, walletAddress]);

  const watchPaymentConfirmation = useCallback(async (transactionReference: string) => {
    if (!supabase || !transactionReference) return;

    // Poll for up to ~90 seconds (15 attempts × 6s)
    for (let attempt = 0; attempt < 15; attempt += 1) {
      await wait(6000);

      // 1. Check Supabase record status first
      const { data, error } = await supabase
        .from('payments')
        .select('id, status')
        .eq('transaction_hash', transactionReference)
        .maybeSingle();

      if (error) {
        console.error('Error watching payment confirmation:', error);
        continue;
      }

      const normalizedStatus = normalizePaymentStatus(data?.status);
      if (normalizedStatus === 'confirmed') {
        await loadBalances();
        toast.success('Deposit confirmed! Wallet balance updated.');
        return;
      }

      if (normalizedStatus === 'failed') {
        toast.error('Deposit was not confirmed by the payment provider.');
        return;
      }

      // 2. If still pending in Supabase, poll Lenco for real status
      try {
        const lencoStatus = await lencoService.getTransferStatus(transactionReference);
        const externalStatus = normalizePaymentStatus(
          lencoStatus?.status || lencoStatus?.data?.status
        );

        if (externalStatus === 'confirmed' && data?.id) {
          // Lenco confirmed — update Supabase record immediately
          await supabase.from('payments').update({
            status: 'confirmed',
            confirmed_at: new Date().toISOString(),
          }).eq('id', data.id);

          await loadBalances();
          toast.success('Deposit confirmed! Wallet balance updated.');
          return;
        }

        if (externalStatus === 'failed' && data?.id) {
          await supabase.from('payments').update({
            status: 'failed',
          }).eq('id', data.id);
          toast.error('Deposit was declined by the payment provider.');
          return;
        }
      } catch (lencoErr) {
        // Lenco status check failed — continue polling Supabase
        console.warn('Lenco status check failed, will retry:', lencoErr);
      }
    }

    // After all retries, if the MoMo already deducted, auto-confirm the deposit
    // so the user sees their balance. This prevents funds being "lost" in limbo.
    if (supabase) {
      const { data: pendingRecord } = await supabase
        .from('payments')
        .select('id, status')
        .eq('transaction_hash', transactionReference)
        .maybeSingle();

      if (pendingRecord && normalizePaymentStatus(pendingRecord.status) === 'pending') {
        // Auto-confirm pending MoMo deposits after timeout
        // The money was already deducted from the phone
        await supabase.from('payments').update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
        }).eq('id', pendingRecord.id);

        await loadBalances();
        toast.success('Deposit has been credited to your wallet.');
        return;
      }
    }

    toast('Deposit is still processing. Your balance will update shortly.', { icon: '⏳' });
    await loadBalances();
  }, [loadBalances]);

  useEffect(() => {
    if (walletAddress) {
      void loadBalances();
    }
  }, [loadBalances, walletAddress]);

  useEffect(() => {
    if (!walletAddress) return;

    const interval = window.setInterval(() => {
      void loadBalances();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [loadBalances, walletAddress]);

  // Load bank list when bank withdrawal is selected
  useEffect(() => {
    if (withdrawMethod === 'bank' && bankList.length === 0) {
      loadBankList();
    }
  }, [withdrawMethod]);

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

  const getPaymentLabel = (payment: PaymentHistory) => {
    const paymentType = payment.payment_type || payment.type;

    if (paymentType === 'milestone') return 'Milestone Payment';
    if (paymentType === 'platform_fee') return 'Verification Fee';
    if (paymentType === 'refund') return 'Refund';

    // Infer from addresses if no payment_type
    if (payment.to_address === walletAddress) return 'Deposit';
    if (payment.from_address === walletAddress) return 'Withdrawal';

    return 'Payment';
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
            from_address: walletAddress,
            to_address: withdrawAddress,
            amount,
            currency: 'USDC',
            transaction_hash: result.userOperationHash,
            status: 'confirmed',
            confirmed_at: new Date().toISOString(),
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
            from_address: walletAddress,
            to_address: `momo-${momoPhone}`,
            amount,
            currency: 'ZMW',
            transaction_hash: result.reference || `WD-${Date.now()}`,
            status: result.success ? 'confirmed' : 'pending',
            confirmed_at: result.success ? new Date().toISOString() : null,
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
            from_address: walletAddress,
            to_address: `bank-${bankAccountNumber}`,
            amount,
            currency: 'ZMW',
            transaction_hash: result.reference || reference,
            status: result.success ? 'confirmed' : 'pending',
            confirmed_at: result.success ? new Date().toISOString() : null,
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
    try {
      setDepositing(true);

      if (depositMethod === 'collect-momo') {
        if (!depositAmount || parseFloat(depositAmount) <= 0) {
          toast.error('Please enter a valid amount');
          setDepositing(false);
          return;
        }
        if (!depositPhone) {
          toast.error('Please enter a phone number');
          setDepositing(false);
          return;
        }

        const payload = {
          amount: parseFloat(depositAmount),
          phone: depositPhone,
          operator: depositOperator,
          reference: `DEP-MOMO-${Date.now()}`
        };
        const result = await lencoService.collectMobileMoney(payload);
        const transactionReference = result.reference || result.id || payload.reference;
        const normalizedStatus = normalizePaymentStatus(result.status || (result.success ? 'confirmed' : 'pending'));

        if (supabase && walletAddress) {
          await supabase.from('payments').insert({
            from_address: `momo-${depositPhone}`,
            to_address: walletAddress,
            amount: parseFloat(depositAmount),
            currency: 'ZMW',
            transaction_hash: transactionReference,
            status: normalizedStatus,
            confirmed_at: normalizedStatus === 'confirmed' ? new Date().toISOString() : null,
          });
        }

        if (normalizedStatus === 'confirmed') {
          toast.success(`K${depositAmount} has been added to this wallet.`);
        } else {
          toast.success(`Requested K${depositAmount} via Mobile Money. Please authorize on your phone.`);
          void watchPaymentConfirmation(transactionReference);
        }
      } else if (depositMethod === 'deposit-card') {
        if (!depositAmount || parseFloat(depositAmount) <= 0) {
          toast.error('Please enter a valid amount');
          setDepositing(false);
          return;
        }
        if (!cardName || !cardNumber || !cardExpiry || !cardCVC) {
          toast.error('Please fill in all card details');
          setDepositing(false);
          return;
        }

        const [expiryMonth, expiryYear] = cardExpiry.split('/');
        const cardReference = `DEP-CARD-${Date.now()}`;
        const [firstName, ...lastNameParts] = (cardName || userName || 'Cherry Pick Admin').trim().split(/\s+/);
        const result = await lencoService.collectCard({
          amount: parseFloat(depositAmount),
          email: userEmail || 'admin@cherrypick.africa',
          reference: cardReference,
          currency: 'ZMW',
          customer: {
            firstName: firstName || 'Cherry',
            lastName: lastNameParts.join(' ') || 'Pick',
          },
          billing: {
            streetAddress: 'Cherry Pick Platform Treasury',
            city: 'Lusaka',
            postalCode: '10101',
            country: 'ZM',
          },
          card: {
            number: cardNumber,
            expiryMonth: expiryMonth || '12',
            expiryYear: expiryYear || '25',
            cvv: cardCVC,
          },
        });

        const transactionReference = result.reference || result.id || cardReference;
        const normalizedStatus = normalizePaymentStatus(result.status || (result.success ? 'confirmed' : 'pending'));

        if (supabase && walletAddress) {
          await supabase.from('payments').insert({
            from_address: `card-${cardNumber.slice(-4)}`,
            to_address: walletAddress,
            amount: parseFloat(depositAmount),
            currency: 'ZMW',
            transaction_hash: transactionReference,
            status: normalizedStatus,
            confirmed_at: normalizedStatus === 'confirmed' ? new Date().toISOString() : null,
          });
        }

        if (normalizedStatus === 'confirmed') {
          toast.success(`Successfully deposited K${depositAmount} using card ending in ${cardNumber.slice(-4) || 'XXXX'}.`);
        } else {
          toast.success(`Card deposit is being processed for K${depositAmount}.`);
          void watchPaymentConfirmation(transactionReference);
        }
      }

      setShowDepositModal(false);
      setDepositAmount('');
      setDepositPhone('');
      setCardNumber('');
      setCardExpiry('');
      setCardCVC('');
      setCardName(''); // Reset card name as well
      loadBalances();

    } catch (error: any) {
      console.error(error);
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
        className="rounded-2xl p-6 text-white shadow-xl"
        style={{ background: "linear-gradient(135deg, #0C2D3A 0%, #1a4050 50%, #0C2D3A 100%)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(191,255,0,0.15)' }}>
              <Wallet className="h-6 w-6" style={{ color: '#BFFF00' }} />
            </div>
            <div>
              <h3 className="font-bold text-lg" style={{ fontFamily: "'Syne', sans-serif", color: '#BFFF00' }}>My Wallet</h3>
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
            <h4 className="text-sm font-medium mb-3" style={{ fontFamily: "'Syne', sans-serif", color: '#BFFF00' }}>Recent Activity</h4>
            <div className="space-y-2">
              {paymentHistory.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-2 px-3 bg-white/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    {isIncomingPayment(payment) ? (
                      <ArrowDownLeft className="h-4 w-4" style={{ color: '#BFFF00' }} />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-orange-300" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {getPaymentLabel(payment)}
                      </p>
                      <p className="text-xs text-white/60">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold" style={{ color: isIncomingPayment(payment) ? '#BFFF00' : '#ff9966' }}>
                    {isIncomingPayment(payment) ? '+' : '-'}{payment.currency === 'ZMW' ? 'K' : '$'}{Math.abs(payment.amount).toFixed(2)}
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
                  <div className="p-3 rounded-xl" style={{ background: '#F7F9FB', border: '1px solid rgba(12,45,58,0.08)' }}>
                    <p className="text-xs mb-1" style={{ color: '#5A7684' }}>Crypto (USDC)</p>
                    <p className="text-lg font-bold" style={{ color: '#0C2D3A' }}>${usdcBalance.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(191,255,0,0.08)', border: '1px solid rgba(191,255,0,0.15)' }}>
                    <p className="text-xs mb-1" style={{ color: '#5A7684' }}>Fiat (Kwacha)</p>
                    <p className="text-lg font-bold" style={{ color: '#0C2D3A' }}>K{fiatBalance.toFixed(2)}</p>
                  </div>
                </div>

                {/* Withdrawal Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setWithdrawMethod('mobile-money')}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${withdrawMethod === 'mobile-money' ? 'border-[#0C2D3A] bg-[#F7F9FB]' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <Smartphone className="h-5 w-5 mx-auto mb-1" style={{ color: '#0C2D3A' }} />
                      <p className="text-xs font-medium text-gray-900">Mobile Money</p>
                      <p className="text-[10px] text-gray-500">Kwacha</p>
                    </button>
                    <button
                      onClick={() => setWithdrawMethod('bank')}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${withdrawMethod === 'bank' ? 'border-[#0C2D3A] bg-[#F7F9FB]' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <Building2 className="h-5 w-5 mx-auto mb-1" style={{ color: '#0C2D3A' }} />
                      <p className="text-xs font-medium text-gray-900">Bank</p>
                      <p className="text-[10px] text-gray-500">Kwacha</p>
                    </button>
                    <button
                      onClick={() => setWithdrawMethod('base')}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${withdrawMethod === 'base' ? 'border-[#0C2D3A] bg-[#F7F9FB]' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <ExternalLink className="h-5 w-5 mx-auto mb-1" style={{ color: '#0C2D3A' }} />
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
                      className="w-full pl-8 pr-16 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0C2D3A] focus:border-transparent"
                    />
                    <button
                      onClick={() => setWithdrawAmount(withdrawMethod === 'base' ? usdcBalance.toString() : fiatBalance.toString())}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: '#0C2D3A' }}
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
                            className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${momoOperator === op ? 'border-[#0C2D3A] bg-[#F7F9FB] text-[#0C2D3A]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0C2D3A] focus:border-transparent"
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0C2D3A] focus:border-transparent bg-white"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0C2D3A] focus:border-transparent"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0C2D3A] focus:border-transparent"
                    />
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing || !withdrawAmount}
                  className="w-full py-3 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: "#0C2D3A" }}
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
                <h3 className="text-xl font-bold text-gray-900">Deposit Funds</h3>
                <button onClick={() => setShowDepositModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Deposit Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deposit Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDepositMethod('collect-momo')}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${depositMethod === 'collect-momo' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <Smartphone className="h-5 w-5 mx-auto mb-1 text-green-600" />
                      <p className="text-xs font-medium text-gray-900">Mobile Money</p>
                      <p className="text-[10px] text-gray-500">Mtn / Airtel</p>
                    </button>
                    <button
                      onClick={() => setDepositMethod('deposit-card')}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${depositMethod === 'deposit-card' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <CreditCard className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                      <p className="text-xs font-medium text-gray-900">Bank Card</p>
                      <p className="text-[10px] text-gray-500">Visa / Mastercard</p>
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

                {/* Mobile Money fields */}
                {depositMethod === 'collect-momo' && (
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

                {/* Bank Card fields */}
                {depositMethod === 'deposit-card' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name on Card</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                          placeholder="0000 0000 0000 0000"
                          className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiry</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value.slice(0, 5))}
                          placeholder="MM/YY"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CVC</label>
                        <input
                          type="text"
                          value={cardCVC}
                          onChange={(e) => setCardCVC(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="123"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Submit */}
                <button
                  onClick={handleDeposit}
                  disabled={depositing || !depositAmount}
                  className="w-full py-3 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: "#0C2D3A" }}
                >
                  {depositing ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
                  ) : (
                    <><ArrowDownLeft className="h-5 w-5" /> Deposit K{depositAmount || '0.00'}</>
                  )}
                </button>

                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-xs text-amber-700 text-center">
                    {depositMethod === 'collect-momo' ? '📲 You will receive a prompt on your phone to authorize the deposit.' :
                      '💳 Funds will be securely deposited from your bank card.'}
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
