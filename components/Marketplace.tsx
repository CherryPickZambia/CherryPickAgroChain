"use client";

import { useState, useEffect } from "react";
import {
  Search, ShoppingCart, MapPin, Heart, User, CheckCircle,
  Plus, X, Send, Gavel, ArrowLeft, Phone, CreditCard, Wallet,
  SlidersHorizontal, TrendingUp, Package2, BadgeCheck, Wheat,
  ChevronDown, Sparkles, Star, Clock, DollarSign, Award
} from "lucide-react";
import Link from "next/link";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { getMarketplaceListings, createMarketplaceOrder, type MarketplaceListing as DBListing } from "@/lib/database";
import { lencoService } from "@/lib/lenco-service";
import { transferUSDC } from "@/lib/blockchain/contractInteractions";
import { createWalletClient, custom } from "viem";
import { base, baseSepolia } from "viem/chains";

const ADMIN_WALLET = "0x742d35Cc6634C0532925a3b844Bc9e7595f8E2B1";

// ─── SAMPLE DATA ────────────────────────────────────────────────────────────

const SAMPLE_BULK_ORDERS: BulkOrder[] = [
  {
    id: "bulk-1",
    buyerId: "buyer-1",
    buyerName: "Fresh Foods Ltd",
    cropType: "Mangoes",
    quantity: 2000,
    targetPrice: 16,
    deliveryDate: "2024-12-01",
    location: "Lusaka",
    status: "open",
    bids: 3,
    description: "Premium Kent mangoes for export. Must be Grade A or Premium.",
    endTime: new Date(Date.now() + 86400000 * 2).toISOString(),
    bidsList: [
      { bidderName: "Farmer Mulenga", bidderAddress: "0x123...", price: 15.5, quantity: 2000, timestamp: new Date(Date.now() - 3600000).toISOString() },
      { bidderName: "AgroPro Zambia", bidderAddress: "0x456...", price: 15.8, quantity: 1500, timestamp: new Date(Date.now() - 7200000).toISOString() },
    ],
  },
  {
    id: "bulk-2",
    buyerId: "buyer-2",
    buyerName: "Market Suppliers Co",
    cropType: "Tomatoes",
    quantity: 5000,
    targetPrice: 10,
    deliveryDate: "2024-11-25",
    location: "Ndola",
    status: "open",
    bids: 5,
    description: "Fresh roma tomatoes for processing. Regular supply preferred.",
    endTime: new Date(Date.now() + 3600000 * 5).toISOString(),
    bidsList: [],
  },
];

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface MarketplaceListing {
  id: string;
  farmerId: string;
  farmerAddress: string;
  farmerName: string;
  farmerRating: number;
  cropType: string;
  variety: string;
  quantity: number;
  pricePerKg: number;
  location: string;
  harvestDate: string;
  quality: "Premium" | "Grade A" | "Grade B";
  certifications: string[];
  images: string[];
  description: string;
  deliveryOptions: string[];
  aiHealthScore?: number;
  aiDiagnosis?: string;
  aiVerified?: boolean;
}

interface Bid {
  bidderName: string;
  bidderAddress: string;
  price: number;
  quantity: number;
  timestamp: string;
}

interface BulkOrder {
  id: string;
  buyerId: string;
  buyerName?: string;
  cropType: string;
  quantity: number;
  targetPrice: number;
  deliveryDate: string;
  location: string;
  status: "open" | "matched" | "completed";
  bids: number;
  description?: string;
  endTime: string;
  bidsList: Bid[];
  winner?: Bid;
}

interface BulkOrderForm {
  cropType: string;
  quantity: string;
  targetPrice: string;
  deliveryDate: string;
  location: string;
  description: string;
}

interface BidForm {
  price: string;
  quantity: string;
  message: string;
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const CROP_EMOJI: Record<string, string> = {
  Mangoes: "🥭", Tomatoes: "🍅", Pineapples: "🍍",
  "Cashew nuts": "🌰", Bananas: "🍌", Beetroot: "🟣",
  Strawberries: "🍓", Pawpaw: "🍈",
};

const CROP_BG: Record<string, string> = {
  Mangoes: "from-amber-50 to-orange-50",
  Tomatoes: "from-red-50 to-rose-50",
  Pineapples: "from-yellow-50 to-amber-50",
  "Cashew nuts": "from-stone-50 to-amber-50",
  Bananas: "from-yellow-50 to-lime-50",
  Beetroot: "from-purple-50 to-pink-50",
  Strawberries: "from-rose-50 to-pink-50",
  Pawpaw: "from-orange-50 to-yellow-50",
};

const QUALITY_BADGE: Record<string, string> = {
  Premium: "bg-amber-50 text-amber-700 border border-amber-200",
  "Grade A": "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "Grade B": "bg-stone-100 text-stone-600 border border-stone-200",
};

// ─── COUNTDOWN ───────────────────────────────────────────────────────────────

const Countdown = ({ endTime }: { endTime: string }) => {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const timer = setInterval(() => {
      const distance = new Date(endTime).getTime() - Date.now();
      if (distance < 0) { clearInterval(timer); setTimeLeft("ENDED"); return; }
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime]);
  return <span className="font-mono font-bold text-[#0C2D3A]">{timeLeft}</span>;
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function Marketplace() {
  const { evmAddress } = useEvmAddress();

  // Cart & checkout
  const [showCart, setShowCart] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "payment" | "success">("cart");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"momo" | "card" | "usdc">("momo");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [cart, setCart] = useState<Array<{ id: string; listing: MarketplaceListing; qty: number }>>([]);

  // UI
  const [activeTab, setActiveTab] = useState<"browse" | "auction">("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Data
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [bulkOrders, setBulkOrders] = useState<BulkOrder[]>(SAMPLE_BULK_ORDERS);

  // Auction
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedBulkOrder, setSelectedBulkOrder] = useState<BulkOrder | null>(null);
  const [auctionWinnerMode, setAuctionWinnerMode] = useState(false);
  const [auctionToPay, setAuctionToPay] = useState<BulkOrder | null>(null);

  // Forms
  const [bulkOrderForm, setBulkOrderForm] = useState<BulkOrderForm>({ cropType: "", quantity: "", targetPrice: "", deliveryDate: "", location: "", description: "" });
  const [bidForm, setBidForm] = useState<BidForm>({ price: "", quantity: "", message: "" });
  const [momoDetails, setMomoDetails] = useState({ phone: "", network: "mtn" as "mtn" | "airtel" });
  const [cardDetails, setCardDetails] = useState({ number: "", expiryMonth: "", expiryYear: "", cvv: "", firstName: "", lastName: "", email: "", streetAddress: "", city: "", postalCode: "", country: "ZM" });

  // ─── LOGIC ─────────────────────────────────────────────────────────────────

  const calculateTotal = () => cart.reduce((sum, item) => sum + item.listing.pricePerKg * item.qty, 0);

  const updateCartQty = (listingId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id !== listingId) return item;
      const newQty = Math.max(1, item.qty + delta);
      return { ...item, qty: newQty };
    }));
  };

  const handleCheckout = async () => {
    if (!evmAddress) { toast.error("Please connect your wallet first"); return; }
    setIsProcessingPayment(true);
    try {
      let success = false;
      let txHash = "";

      if (selectedPaymentMethod === "usdc") {
        const walletClient = createWalletClient({
          chain: process.env.NEXT_PUBLIC_NETWORK === "testnet" ? baseSepolia : base,
          transport: custom((window as any).ethereum),
        });
        toast.loading("Initiating USDC transfer...", { id: "payment" });
        try {
          const result = await transferUSDC(walletClient, ADMIN_WALLET as `0x${string}`, calculateTotal());
          success = result.success; txHash = result.transactionHash;
        } catch (err: any) {
          toast.error(`USDC Transfer failed: ${err.message}`);
          setIsProcessingPayment(false); toast.dismiss("payment"); return;
        }
        toast.dismiss("payment");
      } else if (selectedPaymentMethod === "momo") {
        if (!momoDetails.phone) { toast.error("Please enter mobile money number"); setIsProcessingPayment(false); return; }
        toast.loading("Sending MoMo payment request...", { id: "payment" });
        try {
          const result = await lencoService.collectMobileMoney({ amount: calculateTotal(), phone: momoDetails.phone, operator: momoDetails.network, reference: `MP-${Date.now()}` });
          const momoStatus = (result.status || '').toLowerCase();
          // MoMo payments are often 'pending' initially — user authorizes on their phone
          success = momoStatus === "success" || momoStatus === "successful" || momoStatus === "pending" || momoStatus === "processing" || result.success === true;
          txHash = result.reference || result.id || `MP-${Date.now()}`;
          if (momoStatus === "pending" || momoStatus === "processing") {
            toast.success("Please check your phone to authorize the payment.", { duration: 8000 });
          }
        } catch (err: any) { toast.error(`MoMo Payment failed: ${err.message}`); setIsProcessingPayment(false); toast.dismiss("payment"); return; }
        toast.dismiss("payment");
      } else if (selectedPaymentMethod === "card") {
        if (!cardDetails.number) { toast.error("Please enter card details"); setIsProcessingPayment(false); return; }
        toast.loading("Processing card payment...", { id: "payment" });
        try {
          const result = await lencoService.collectCard({
            amount: calculateTotal(), email: cardDetails.email || "buyer@agrochain.com",
            reference: `MP-CARD-${Date.now()}`, currency: "ZMW",
            customer: { firstName: cardDetails.firstName || "Market", lastName: cardDetails.lastName || "Buyer" },
            billing: { streetAddress: cardDetails.streetAddress || "Plot 12, Cairo Rd", city: cardDetails.city || "Lusaka", postalCode: cardDetails.postalCode || "10101", country: "ZM" },
            card: { number: cardDetails.number, expiryMonth: cardDetails.expiryMonth || "12", expiryYear: cardDetails.expiryYear || "25", cvv: cardDetails.cvv || "123" },
          });
          success = result.status === "success" || result.success === true; txHash = result.reference || result.id;
        } catch (err: any) { toast.error(`Card Payment failed: ${err.message}`); setIsProcessingPayment(false); toast.dismiss("payment"); return; }
        toast.dismiss("payment");
      }

      if (success) {
        if (auctionWinnerMode && auctionToPay) {
          await createMarketplaceOrder({ listing_id: auctionToPay.id, buyer_address: evmAddress, farmer_address: ADMIN_WALLET, quantity: parseInt(bidForm.quantity), unit_price: parseFloat(bidForm.price), total_amount: parseFloat(bidForm.price) * parseInt(bidForm.quantity), payment_status: "completed", payment_tx_hash: txHash, delivery_status: "pending" });
        } else {
          for (const item of cart) {
            await createMarketplaceOrder({ listing_id: item.id, buyer_address: evmAddress, farmer_address: item.listing.farmerAddress, quantity: item.qty, unit_price: item.listing.pricePerKg, total_amount: item.listing.pricePerKg * item.qty, payment_status: "completed", payment_tx_hash: txHash, delivery_status: "pending" });
          }
        }
        setCart([]); setCheckoutStep("success"); toast.success("Payment successful!");
      } else { toast.error("Payment failed. Please try again."); }
    } catch (error: any) {
      toast.error(error.message || "Unknown error");
    } finally { setIsProcessingPayment(false); }
  };

  const addToCart = (listingId: string) => {
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) { toast.error("Product not found!"); return; }
    if (cart.find((item) => item.id === listingId)) { toast.error("Already in cart!"); return; }
    setCart([...cart, { id: listingId, listing, qty: 1 }]);
    toast.success(`${listing.cropType} added to cart!`);
  };

  const removeFromCart = (listingId: string) => setCart(cart.filter((item) => item.id !== listingId));
  const toggleWishlist = (id: string) => setWishlist((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleCreateBulkOrder = () => {
    if (!bulkOrderForm.cropType || !bulkOrderForm.quantity || !bulkOrderForm.targetPrice || !bulkOrderForm.deliveryDate) { toast.error("Please fill in all required fields"); return; }
    const newOrder: BulkOrder = { id: `bulk-${Date.now()}`, buyerId: evmAddress || "anonymous", buyerName: "Your Order", cropType: bulkOrderForm.cropType, quantity: parseInt(bulkOrderForm.quantity), targetPrice: parseFloat(bulkOrderForm.targetPrice), deliveryDate: bulkOrderForm.deliveryDate, location: bulkOrderForm.location || "Zambia", status: "open", bids: 0, description: bulkOrderForm.description, endTime: new Date(Date.now() + 86400000).toISOString(), bidsList: [] };
    setBulkOrders([newOrder, ...bulkOrders]);
    setBulkOrderForm({ cropType: "", quantity: "", targetPrice: "", deliveryDate: "", location: "", description: "" });
    toast.success("Bulk order posted!");
  };

  const handlePlaceBid = () => {
    if (!bidForm.price || !bidForm.quantity) { toast.error("Please enter price and quantity"); return; }
    if (selectedBulkOrder) {
      const newBid: Bid = { bidderName: "You", bidderAddress: evmAddress || "0x...", price: parseFloat(bidForm.price), quantity: parseInt(bidForm.quantity), timestamp: new Date().toISOString() };
      setBulkOrders((prev) => prev.map((o) => o.id === selectedBulkOrder.id ? { ...o, bids: o.bids + 1, bidsList: [newBid, ...o.bidsList] } : o));
      toast.success(`Bid placed at ZK ${bidForm.price}/kg`);
      setShowBidModal(false); setAuctionWinnerMode(true); setAuctionToPay(selectedBulkOrder);
      setCheckoutStep("payment"); setShowCart(true);
    }
  };

  const openBidModal = (order: BulkOrder) => {
    setSelectedBulkOrder(order);
    setBidForm({ price: order.targetPrice.toString(), quantity: Math.min(1000, order.quantity).toString(), message: "" });
    setShowBidModal(true);
  };

  useEffect(() => { loadMarketplaceData(); }, [selectedCategory, sortBy]);

  const loadMarketplaceData = async () => {
    try {
      const filters: any = { status: "active" };
      if (selectedCategory !== "all") filters.crop_type = selectedCategory;
      const dbListings = await getMarketplaceListings(filters);
      const transformed: MarketplaceListing[] = dbListings.map((l: DBListing) => {
        let quality: "Premium" | "Grade A" | "Grade B" = "Grade A";
        if (l.quality_grade === "Premium") quality = "Premium";
        else if (l.quality_grade === "B" || l.quality_grade === "C") quality = "Grade B";
        return { id: l.id, farmerId: l.farmer_id, farmerAddress: l.farmer_address || "", farmerName: l.farmer_name || "Unknown Farmer", farmerRating: 4.5, cropType: l.crop_type, variety: l.crop_type, quantity: Number(l.available_quantity), pricePerKg: Number(l.price_per_unit), location: l.location || "Zambia", harvestDate: l.harvest_date || new Date().toISOString().split("T")[0], quality, certifications: l.organic ? ["Organic"] : [], images: l.image_url ? [l.image_url] : [], description: l.description || "", deliveryOptions: ["Farm Pickup", "Delivery Available"], aiHealthScore: l.ai_health_score, aiDiagnosis: l.ai_diagnosis, aiVerified: l.ai_verified };
      });
      const sorted = [...transformed].sort((a, b) => sortBy === "price-low" ? a.pricePerKg - b.pricePerKg : sortBy === "price-high" ? b.pricePerKg - a.pricePerKg : 0);
      setListings(sorted);
    } catch (error) {
      console.error("Error loading marketplace:", error);
      toast.error("Failed to load listings");
    }
  };

  const filteredListings = listings.filter((l) => {
    const matchesSearch = l.cropType.toLowerCase().includes(searchQuery.toLowerCase()) || l.variety.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || l.cropType === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F7F9FB]">

      {/* ═══ STICKY TOP NAV ═══ */}
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-1.5 text-[#5A7684] hover:text-[#0C2D3A] transition-colors text-sm" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 500 }}>
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <div className="w-px h-5 bg-gray-200" />
            <div className="flex items-center gap-2.5">
              <span className="text-xl" role="img" aria-label="cherry">🍒</span>
              <div className="leading-none">
                <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '0.9rem', color: '#0C2D3A' }}>Marketplace</p>
                <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.6rem', color: '#5A7684', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cherry Pick</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(191,255,0,0.12)', border: '1px solid rgba(191,255,0,0.2)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#BFFF00] animate-pulse" />
              <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600, fontSize: '0.7rem', color: '#0C2D3A' }}>{filteredListings.length} live</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCart(true)}
              className="relative flex items-center gap-2 px-4 py-2 bg-[#0C2D3A] hover:bg-[#0C2D3A] text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-amber-400 text-stone-900 text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                  {cart.length}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* ═══ CART DRAWER ═══ */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { if (!isProcessingPayment) { setShowCart(false); setCheckoutStep("cart"); setAuctionWinnerMode(false); } }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[10000]"
            />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[10001] flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0C2D3A]/10 flex items-center justify-center">
                    <ShoppingCart className="h-4 w-4 text-[#0C2D3A]" />
                  </div>
                  <h2 className="text-base font-bold text-[#0C2D3A]">{auctionWinnerMode ? "Winner's Checkout" : "Your Cart"}</h2>
                </div>
                <button onClick={() => { setShowCart(false); setCheckoutStep("cart"); setAuctionWinnerMode(false); }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">

                {/* Step: Cart */}
                {checkoutStep === "cart" && (
                  <>
                    {cart.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                          <ShoppingCart className="h-8 w-8 text-gray-300" />
                        </div>
                        <p className="font-semibold text-gray-600">Your cart is empty</p>
                        <p className="text-sm text-gray-400 mt-1">Browse products and add them here</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {cart.map((item) => (
                          <div key={item.id} className="flex gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center text-2xl shrink-0">
                              {CROP_EMOJI[item.listing.cropType] || "🌿"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[#0C2D3A] text-sm">{item.listing.cropType}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">{item.listing.location}</span>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <p className="font-black text-[#0C2D3A] text-sm">ZK {(item.listing.pricePerKg * item.qty).toLocaleString()}</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                    <button onClick={() => updateCartQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 text-sm font-bold">−</button>
                                    <span className="w-8 text-center text-xs font-bold text-[#0C2D3A]">{item.qty}</span>
                                    <button onClick={() => updateCartQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 text-sm font-bold">+</button>
                                  </div>
                                  <button onClick={() => removeFromCart(item.id)} className="text-xs text-red-500 hover:text-red-700 font-semibold">Remove</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="flex items-center justify-between p-4 bg-[#0C2D3A]/5 rounded-2xl border border-[#0C2D3A]/10 mt-2">
                          <span className="text-sm font-bold text-gray-700">Subtotal</span>
                          <span className="text-lg font-black text-[#0C2D3A]">ZK {calculateTotal().toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Step: Payment */}
                {checkoutStep === "payment" && (
                  <div className="space-y-5">
                    {!auctionWinnerMode && (
                      <button onClick={() => setCheckoutStep("cart")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0C2D3A] font-medium transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Back to Cart
                      </button>
                    )}
                    {auctionWinnerMode && auctionToPay && (
                      <div className="flex items-center gap-3 p-4 bg-[#0C2D3A]/5 rounded-2xl border border-[#0C2D3A]/10">
                        <div className="w-10 h-10 rounded-xl bg-[#0C2D3A] flex items-center justify-center shrink-0">
                          <Gavel className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0C2D3A] uppercase tracking-wider">Auction Win</p>
                          <p className="font-bold text-[#0C2D3A] text-sm">{auctionToPay.cropType} — ZK {(parseFloat(bidForm.price || "0") * parseInt(bidForm.quantity || "0")).toLocaleString()}</p>
                        </div>
                      </div>
                    )}

                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Payment Method</h3>
                    <div className="space-y-2.5">
                      {[
                        { id: "momo", label: "Mobile Money", sub: "MTN / Airtel Zambia", icon: Phone, color: "bg-amber-500" },
                        { id: "card", label: "Bank Card", sub: "Visa / Mastercard", icon: CreditCard, color: "bg-blue-500" },
                        { id: "usdc", label: "USDC (Base)", sub: "Stablecoin payment", icon: Wallet, color: "bg-indigo-600" },
                      ].map((method) => (
                        <div key={method.id}>
                          <button
                            onClick={() => setSelectedPaymentMethod(method.id as any)}
                            className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border-2 transition-all text-left ${selectedPaymentMethod === method.id ? "border-[#0C2D3A] bg-[#0C2D3A]/5" : "border-gray-200 hover:border-gray-300 bg-white"}`}
                          >
                            <div className={`w-9 h-9 rounded-xl ${method.color} flex items-center justify-center shrink-0`}>
                              <method.icon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#0C2D3A]">{method.label}</p>
                              <p className="text-xs text-gray-500">{method.sub}</p>
                            </div>
                            {selectedPaymentMethod === method.id && (
                              <CheckCircle className="h-5 w-5 text-[#0C2D3A] ml-auto" />
                            )}
                          </button>

                          <AnimatePresence>
                            {selectedPaymentMethod === method.id && method.id === "momo" && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                <div className="p-4 space-y-3">
                                  <input type="tel" placeholder="Phone number (e.g. 097...)" value={momoDetails.phone}
                                    onChange={(e) => setMomoDetails({ ...momoDetails, phone: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0C2D3A]/20 focus:border-[#0C2D3A]" />
                                  <div className="relative">
                                    <select value={momoDetails.network} onChange={(e) => setMomoDetails({ ...momoDetails, network: e.target.value as any })}
                                      className="w-full appearance-none px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#0C2D3A] outline-none focus:ring-2 focus:ring-[#0C2D3A]/20 pr-8">
                                      <option value="mtn">MTN Zambia</option>
                                      <option value="airtel">Airtel Zambia</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                  </div>
                                </div>
                              </motion.div>
                            )}
                            {selectedPaymentMethod === method.id && method.id === "card" && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                <div className="p-4 space-y-3">
                                  <input type="text" placeholder="Card Number" value={cardDetails.number}
                                    onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0C2D3A]/20 focus:border-[#0C2D3A] transition-all font-bold text-lg" />
                                  <div className="grid grid-cols-3 gap-2">
                                    {[
                                      { placeholder: "MM", field: "expiryMonth" },
                                      { placeholder: "YY", field: "expiryYear" },
                                      { placeholder: "CVV", field: "cvv" },
                                    ].map((f) => (
                                      <input key={f.field} type="text" placeholder={f.placeholder}
                                        onChange={(e) => setCardDetails({ ...cardDetails, [f.field]: e.target.value })}
                                        className="px-3 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0C2D3A]/20 focus:border-[#0C2D3A] transition-all font-bold text-lg" />
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                            {selectedPaymentMethod === method.id && method.id === "usdc" && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                <div className="p-4">
                                  <div className="p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    <p className="text-xs text-gray-500 mb-1 font-medium">Paying from wallet:</p>
                                    <p className="text-xs font-mono font-bold text-[#0C2D3A] truncate">{evmAddress || "No wallet connected"}</p>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="p-5 bg-gray-900 rounded-2xl text-white">
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Total Payment</p>
                      <p className="text-3xl font-black">ZK {calculateTotal().toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {/* Step: Success */}
                {checkoutStep === "success" && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-5">
                      <CheckCircle className="h-10 w-10 text-emerald-600" />
                    </motion.div>
                    <h3 className="text-xl font-black text-[#0C2D3A] mb-2">Payment Successful!</h3>
                    <p className="text-sm text-gray-500 mb-8 max-w-xs">
                      Your order has been recorded and the farmer has been notified.
                    </p>
                    <button onClick={() => { setShowCart(false); setCheckoutStep("cart"); setAuctionWinnerMode(false); }}
                      className="w-full py-3.5 bg-[#0C2D3A] text-white rounded-xl font-bold hover:bg-[#0C2D3A] transition-colors">
                      Continue Shopping
                    </button>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              {(cart.length > 0 || auctionWinnerMode) && checkoutStep !== "success" && (
                <div className="p-5 border-t border-gray-100">
                  {checkoutStep === "cart" ? (
                    <button onClick={() => setCheckoutStep("payment")}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#0C2D3A] hover:bg-[#0C2D3A] text-white rounded-xl font-bold text-sm transition-colors shadow-sm">
                      Proceed to Checkout
                    </button>
                  ) : (
                    <button onClick={handleCheckout} disabled={isProcessingPayment}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#0C2D3A] hover:bg-[#0C2D3A] text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 shadow-sm">
                      {isProcessingPayment ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Complete Payment"}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ BID MODAL ═══ */}
      <AnimatePresence>
        {showBidModal && selectedBulkOrder && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBidModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-md z-[10002]"
            />
            <motion.div initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 16 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-[10003] overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#0C2D3A] flex items-center justify-center shadow-lg">
                      <Gavel className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-[#0C2D3A]">Place Your Bid</h3>
                      <p className="text-xs font-bold text-[#0C2D3A] uppercase tracking-wider">Live Auction</p>
                    </div>
                  </div>
                  <button onClick={() => setShowBidModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Time Left</p>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#0C2D3A]" />
                        <Countdown endTime={selectedBulkOrder.endTime} />
                      </div>
                    </div>
                    <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Target</p>
                      <p className="font-bold text-[#0C2D3A] text-sm">ZK {selectedBulkOrder.targetPrice}/kg</p>
                    </div>
                  </div>

                  {/* Inputs */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Your Bid (ZK/kg)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0C2D3A]" />
                      <input type="number" value={bidForm.price} onChange={(e) => setBidForm({ ...bidForm, price: e.target.value })}
                        className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-[#0C2D3A] focus:bg-white rounded-xl outline-none transition-all font-bold text-lg"
                        placeholder="e.g. 14.50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Quantity (kg)</label>
                    <input type="number" value={bidForm.quantity} onChange={(e) => setBidForm({ ...bidForm, quantity: e.target.value })}
                      className="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-[#0C2D3A] focus:bg-white rounded-xl outline-none transition-all font-bold text-lg" />
                  </div>

                  {/* Summary */}
                  <div className="flex items-center justify-between p-4 bg-[#0C2D3A]/5 rounded-xl border border-[#0C2D3A]/10">
                    <span className="text-sm font-semibold text-gray-700">Total Bid Value</span>
                    <span className="text-base font-black text-[#0C2D3A]">ZK {(parseFloat(bidForm.price || "0") * parseInt(bidForm.quantity || "0")).toLocaleString()}</span>
                  </div>

                  {/* Bid history */}
                  {selectedBulkOrder.bidsList.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Live Activity</p>
                      <div className="space-y-1.5 max-h-28 overflow-y-auto">
                        {selectedBulkOrder.bidsList.map((bid, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#0C2D3A]/10 flex items-center justify-center text-[10px] font-black text-[#0C2D3A]">
                                {bid.bidderName.charAt(0)}
                              </div>
                              <span className="text-xs font-semibold text-gray-700">{bid.bidderName}</span>
                            </div>
                            <span className="text-xs font-black text-[#0C2D3A]">ZK {bid.price}/kg</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button onClick={handlePlaceBid} disabled={!bidForm.price || !bidForm.quantity}
                    className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-sm shadow-xl transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100">
                    Confirm Bid & Proceed to Payment
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">

        {/* Hero Banner — ARKTOS */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl relative overflow-hidden" style={{ background: '#0C2D3A' }}>
          <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
            <div className="absolute -top-1/2 -right-1/4 w-[600px] h-[600px]" style={{ background: 'radial-gradient(circle, rgba(191,255,0,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
          </div>
          <div className="relative px-8 py-12 flex flex-col md:flex-row md:items-center gap-8">
            <div className="flex-1">
              <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600, color: '#BFFF00' }} className="inline-flex items-center gap-1.5 mb-5 block">
                <div className="w-1.5 h-1.5 rounded-full bg-[#BFFF00] animate-pulse" />
                Blockchain-Verified Produce
              </span>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1, letterSpacing: '-0.03em' }} className="text-white mb-3">
                Fresh from verified<br /><span style={{ color: '#BFFF00' }}>Zambian farms.</span>
              </h1>
              <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', maxWidth: '380px' }}>
                Every listing is AI-analysed, officer-verified, and traceable from seed to sale.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 shrink-0">
              {[
                { label: "Farmers", value: "120+", icon: BadgeCheck },
                { label: "Live listings", value: filteredListings.length.toString(), icon: Package2 },
                { label: "Provinces", value: "9", icon: MapPin },
              ].map((s) => (
                <div key={s.label} className="bg-white/10 border border-white/10 rounded-xl p-3 sm:p-4 text-center">
                  <s.icon className="h-4 w-4 text-white/50 mx-auto mb-1.5" />
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tabs — ARKTOS */}
        <div className="flex items-center gap-1 p-1 rounded-2xl w-fit" style={{ background: 'rgba(12,45,58,0.05)', border: '1px solid rgba(12,45,58,0.08)' }}>
          {[
            { id: "browse", label: "Browse Products" },
            { id: "auction", label: "Auctions & Bulk Orders" },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              style={activeTab === tab.id ? { fontFamily: "'Syne', sans-serif", fontWeight: 700, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' } : { fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}
              className={`px-5 py-2 rounded-xl text-sm transition-all ${activeTab === tab.id ? "text-[#0C2D3A]" : "text-[#5A7684] hover:text-[#0C2D3A]"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ──────────────────────────────────────
            BROWSE TAB
        ────────────────────────────────────── */}
        {activeTab === "browse" && (
          <div className="space-y-5">

            {/* Search + Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input type="text" placeholder="Search crops, locations…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1a5c38]/20 focus:border-[#1a5c38] transition-all placeholder:text-stone-400" />
              </div>
              <button onClick={() => setShowFilters(!showFilters)}
                style={showFilters ? { fontFamily: "'Syne', sans-serif", fontWeight: 700, background: '#0C2D3A', color: '#BFFF00', border: '1.5px solid #0C2D3A' } : { fontFamily: "'Manrope', sans-serif", fontWeight: 600, background: '#fff', color: '#0C2D3A', border: '1.5px solid rgba(12,45,58,0.12)' }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all shrink-0">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </button>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="bg-white rounded-2xl border border-stone-200 p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: "Category", value: selectedCategory, onChange: (v: string) => setSelectedCategory(v), opts: [["all", "All Categories"], ["Mangoes", "Mangoes"], ["Tomatoes", "Tomatoes"], ["Pineapples", "Pineapples"], ["Cashew nuts", "Cashew Nuts"], ["Bananas", "Bananas"]] },
                      { label: "Sort By", value: sortBy, onChange: (v: string) => setSortBy(v), opts: [["newest", "Newest First"], ["price-low", "Price: Low → High"], ["price-high", "Price: High → Low"]] },
                      { label: "Quality", value: "all", onChange: (_v: string) => {}, opts: [["all", "All Grades"], ["Premium", "Premium"], ["Grade A", "Grade A"], ["Grade B", "Grade B"]] },
                    ].map((f) => (
                      <div key={f.label}>
                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">{f.label}</label>
                        <div className="relative">
                          <select value={f.value} onChange={(e) => f.onChange(e.target.value)}
                            className="w-full appearance-none px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-800 outline-none focus:ring-2 focus:ring-[#1a5c38]/20 focus:border-[#1a5c38] transition-all pr-8">
                            {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[["all", "All"], ["Mangoes", "🥭 Mangoes"], ["Tomatoes", "🍅 Tomatoes"], ["Pineapples", "🍍 Pineapples"], ["Cashew nuts", "🌰 Cashew"], ["Bananas", "🍌 Bananas"], ["Beetroot", "🟣 Beetroot"]].map(([val, label]) => (
                <button key={val} onClick={() => setSelectedCategory(val)}
                  style={selectedCategory === val ? { fontFamily: "'Syne', sans-serif", fontWeight: 700, background: '#0C2D3A', color: '#BFFF00', border: '1.5px solid #0C2D3A' } : { fontFamily: "'Manrope', sans-serif", fontWeight: 600, background: '#fff', color: '#5A7684', border: '1.5px solid rgba(12,45,58,0.12)' }}
                  className="shrink-0 px-4 py-1.5 rounded-full text-sm transition-all whitespace-nowrap hover:border-[#0C2D3A] hover:text-[#0C2D3A]">
                  {label}
                </button>
              ))}
            </div>

            <p className="text-sm text-stone-500">
              Showing <span className="font-semibold text-stone-800">{filteredListings.length}</span> products
            </p>

            {/* Product Grid */}
            {filteredListings.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-stone-200">
                <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Wheat className="h-8 w-8 text-stone-300" />
                </div>
                <p className="font-semibold text-stone-600">No products found</p>
                <p className="text-sm text-stone-400 mt-1">Try adjusting your filters or search query</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredListings.map((listing, i) => {
                  const emoji = CROP_EMOJI[listing.cropType] || "🌿";
                  const bgGrad = CROP_BG[listing.cropType] || "from-stone-50 to-emerald-50";
                  const inWishlist = wishlist.includes(listing.id);

                  return (
                    <motion.div key={listing.id}
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="group bg-white rounded-2xl border border-stone-200/80 overflow-hidden hover:shadow-xl hover:shadow-stone-200/60 hover:-translate-y-1 transition-all duration-300">

                      {/* Image area */}
                      <div className={`relative h-52 bg-gradient-to-br ${bgGrad} flex items-center justify-center overflow-hidden`}>
                        <span className="text-7xl select-none group-hover:scale-110 transition-transform duration-500 filter drop-shadow-sm">
                          {emoji}
                        </span>

                        {/* Wishlist */}
                        <button onClick={() => toggleWishlist(listing.id)}
                          className={`absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md shadow-sm transition-all ${inWishlist ? "bg-red-500 text-white scale-110" : "bg-white/90 text-stone-400 hover:text-red-500"}`}>
                          <Heart className="h-4 w-4" fill={inWishlist ? "currentColor" : "none"} />
                        </button>

                        {/* Badges */}
                        <div className="absolute bottom-3 left-3 flex flex-col gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${QUALITY_BADGE[listing.quality] || ""}`}>
                            <Star className="h-3 w-3" fill="currentColor" />
                            {listing.quality}
                          </span>
                          {listing.aiVerified && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-600 text-white shadow-md">
                              <Sparkles className="h-3 w-3" />
                              AI Verified
                            </span>
                          )}
                          {listing.certifications.includes("Organic") && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#1a5c38] text-white">
                              🌿 Organic
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="p-4 space-y-3.5">

                        {/* AI Health Bar */}
                        {listing.aiHealthScore !== undefined && (
                          <div>
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">AI Health Score</span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${listing.aiHealthScore >= 90 ? "bg-emerald-100 text-emerald-700" : listing.aiHealthScore >= 70 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                                {listing.aiHealthScore}/100
                              </span>
                            </div>
                            <div className="w-full bg-stone-100 rounded-full h-1.5">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${listing.aiHealthScore}%` }} transition={{ duration: 0.9, delay: i * 0.05 }}
                                className={`h-full rounded-full ${listing.aiHealthScore >= 90 ? "bg-emerald-500" : listing.aiHealthScore >= 70 ? "bg-amber-500" : "bg-red-500"}`} />
                            </div>
                          </div>
                        )}

                        {/* Name & Price */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-lg font-bold text-stone-900 leading-tight group-hover:text-[#0C2D3A] transition-colors" style={{ fontFamily: "'Syne', sans-serif" }}>
                              {listing.cropType}
                            </h3>
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-stone-400" />
                              <span className="text-xs text-stone-500">{listing.location}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">per kg</p>
                            <p className="text-2xl font-black leading-none" style={{ fontFamily: "'Syne', sans-serif", color: '#0C2D3A' }}>ZK {listing.pricePerKg}</p>
                          </div>
                        </div>

                        {/* Farmer */}
                        <div className="flex items-center gap-2.5 p-2.5 bg-stone-50 rounded-xl border border-stone-100">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(12,45,58,0.08)' }}>
                            <User className="h-4 w-4" style={{ color: '#0C2D3A' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-stone-800 truncate leading-none">{listing.farmerName}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <CheckCircle className="h-3 w-3" style={{ color: '#0C2D3A' }} />
                              <span className="text-[10px] font-bold uppercase tracking-tight" style={{ fontFamily: "'Manrope', sans-serif", color: '#0C2D3A' }}>Verified</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Star className="h-3.5 w-3.5 text-amber-400" fill="currentColor" />
                            <span className="text-xs font-bold text-stone-700">{listing.farmerRating}</span>
                          </div>
                        </div>

                        {/* Stock & harvest */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">Available</p>
                            <p className="text-sm font-bold text-stone-900">{listing.quantity.toLocaleString()} kg</p>
                          </div>
                          <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">Harvested</p>
                            <p className="text-sm font-bold text-stone-900 truncate">{listing.harvestDate}</p>
                          </div>
                        </div>

                        {/* CTA */}
                        <button onClick={() => addToCart(listing.id)}
                          style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, background: '#BFFF00', color: '#0C2D3A' }}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm transition-all shadow-sm hover:shadow-md active:scale-[0.98] hover:opacity-90">
                          <Plus className="h-4 w-4" />
                          Add to Cart
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ──────────────────────────────────────
            AUCTION / BULK ORDERS TAB
        ────────────────────────────────────── */}
        {activeTab === "auction" && (
          <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-stone-200 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-[#1a5c38]/10 flex items-center justify-center shrink-0">
                <Gavel className="h-6 w-6 text-[#1a5c38]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900">Auctions & Bulk Orders</h2>
                <p className="text-sm text-stone-500 leading-relaxed">Browse open procurement requests and submit bids to win supply contracts.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Post Bulk Order */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl border border-stone-200 p-5 sticky top-24 shadow-sm">
                  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-stone-100">
                    <div className="w-9 h-9 rounded-xl bg-[#1a5c38] flex items-center justify-center shrink-0">
                      <Plus className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-stone-900">Post Bulk Request</h3>
                      <p className="text-xs text-stone-400">Need a specific bulk supply?</p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Crop Type *</label>
                      <div className="relative">
                        <select value={bulkOrderForm.cropType} onChange={(e) => setBulkOrderForm({ ...bulkOrderForm, cropType: e.target.value })}
                          className="w-full appearance-none px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1a5c38]/20 focus:border-[#1a5c38] transition-all pr-8">
                          <option value="">Select crop…</option>
                          {["Mangoes", "Tomatoes", "Pineapples", "Cashew nuts", "Bananas", "Beetroot", "Strawberries"].map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Qty (kg) *</label>
                        <input type="number" placeholder="1000" value={bulkOrderForm.quantity} onChange={(e) => setBulkOrderForm({ ...bulkOrderForm, quantity: e.target.value })}
                          className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1a5c38]/20 focus:border-[#1a5c38]" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">ZK/kg *</label>
                        <input type="number" placeholder="15" value={bulkOrderForm.targetPrice} onChange={(e) => setBulkOrderForm({ ...bulkOrderForm, targetPrice: e.target.value })}
                          className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1a5c38]/20 focus:border-[#1a5c38]" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Delivery Date *</label>
                      <input type="date" value={bulkOrderForm.deliveryDate} onChange={(e) => setBulkOrderForm({ ...bulkOrderForm, deliveryDate: e.target.value })}
                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1a5c38]/20 focus:border-[#1a5c38]" />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Location</label>
                      <input type="text" placeholder="e.g. Lusaka" value={bulkOrderForm.location} onChange={(e) => setBulkOrderForm({ ...bulkOrderForm, location: e.target.value })}
                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#1a5c38]/20 focus:border-[#1a5c38]" />
                    </div>

                    <button onClick={handleCreateBulkOrder}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-[#1a5c38] hover:bg-[#1a4050] text-white rounded-xl font-semibold text-sm transition-all shadow-sm">
                      <Send className="h-4 w-4" />
                      Post Request
                    </button>
                  </div>
                </div>
              </div>

              {/* Auctions list */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-stone-900">Open Auctions</h3>
                  <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-xs font-bold">{bulkOrders.length} Open</span>
                </div>

                {bulkOrders.map((order, index) => (
                  <motion.div key={order.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}
                    className="bg-white rounded-2xl border border-stone-200 p-5 hover:shadow-lg hover:shadow-stone-200/50 hover:border-stone-300 transition-all group">

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0 group-hover:bg-[#1a5c38]/5 transition-colors text-2xl">
                        {CROP_EMOJI[order.cropType] || "🌿"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <h4 className="text-xl font-black text-stone-900 group-hover:text-[#1a5c38] transition-colors">{order.cropType}</h4>
                            <p className="text-xs text-stone-400 font-medium">by {order.buyerName} · #{order.id.split("-")[1]}</p>
                          </div>
                          <span className="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wide">
                            {order.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                          {[
                            { label: "Quantity", value: `${order.quantity.toLocaleString()} kg`, accent: false },
                            { label: "Target Price", value: `ZK ${order.targetPrice}/kg`, accent: true },
                            { label: "Delivery", value: order.deliveryDate, accent: false },
                            { label: "Location", value: order.location, accent: false },
                          ].map((stat) => (
                            <div key={stat.label} className={`p-2.5 rounded-xl border ${stat.accent ? "bg-[#1a5c38]/5 border-[#1a5c38]/10" : "bg-stone-50 border-stone-100"}`}>
                              <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${stat.accent ? "text-[#1a5c38]" : "text-stone-400"}`}>{stat.label}</p>
                              <p className={`text-sm font-bold truncate ${stat.accent ? "text-[#1a5c38]" : "text-stone-900"}`}>{stat.value}</p>
                            </div>
                          ))}
                        </div>

                        {order.description && (
                          <p className="text-sm text-stone-500 mb-4 leading-relaxed">{order.description}</p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-stone-400" />
                              <Countdown endTime={order.endTime} />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <TrendingUp className="h-3.5 w-3.5 text-stone-400" />
                              <span className="text-xs font-semibold text-stone-600">{order.bids} bids</span>
                            </div>
                          </div>
                          <button onClick={() => openBidModal(order)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-black text-white rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm">
                            <Gavel className="h-3.5 w-3.5" />
                            Place Bid
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
