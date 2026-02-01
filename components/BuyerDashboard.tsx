"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShoppingBag, Package, Clock, CheckCircle, TrendingUp,
  DollarSign, MapPin, User, Mail, Phone, Building,
  Calendar, Filter, Search, Eye, Download, ArrowRight,
  Store, Leaf, Award, ShoppingCart, X
} from "lucide-react";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import PaymentModal from "./PaymentModal";
import toast from "react-hot-toast";
import { getMarketplaceOrders, getBuyerProfile, createOrUpdateBuyerProfile, getMarketplaceListings } from "@/lib/database";
import WalletBalance from "./WalletBalance";

interface Order {
  id: string;
  listing_id: string;
  crop_type: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_amount: number;
  farmer_name: string;
  farmer_address: string;
  payment_status: string;
  delivery_status: string;
  order_date: string;
  delivery_date?: string;
  image_url?: string;
}

interface BuyerProfile {
  name: string;
  email: string;
  phone: string;
  company_name: string;
  delivery_address: string;
  total_spent: number;
  total_orders: number;
  verified: boolean;
}

export default function BuyerDashboard() {
  const { evmAddress } = useEvmAddress();
  const [activeTab, setActiveTab] = useState<"overview" | "marketplace" | "orders" | "profile">("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<BuyerProfile | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [marketplaceListings, setMarketplaceListings] = useState<any[]>([]);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);

  // Load real data from Supabase
  useEffect(() => {
    if (!evmAddress) return;

    loadBuyerData();
  }, [evmAddress]);

  const loadBuyerData = async () => {
    if (!evmAddress) return;

    try {
      // Fetch buyer profile
      const buyerProfile = await getBuyerProfile(evmAddress);

      if (buyerProfile) {
        setProfile({
          name: buyerProfile.name,
          email: buyerProfile.email || "",
          phone: buyerProfile.phone || "",
          company_name: buyerProfile.company_name || "",
          delivery_address: buyerProfile.delivery_address || "",
          total_spent: 0, // Calculate from orders
          total_orders: 0, // Calculate from orders
          verified: buyerProfile.verified,
        });
      } else {
        // Auto-create profile for new users (Sync with CDP)
        const newProfile = await createOrUpdateBuyerProfile({
          wallet_address: evmAddress,
          name: "New Buyer",
          country: "Zambia",
          verified: false
        });

        setProfile({
          name: newProfile.name,
          email: "",
          phone: "",
          company_name: "",
          delivery_address: "",
          total_spent: 0,
          total_orders: 0,
          verified: false,
        });
        toast.success("Welcome! Your buyer profile has been created.");
      }

      // Fetch orders for this buyer
      const dbOrders = await getMarketplaceOrders(evmAddress);

      // Transform orders to component format
      const transformedOrders: Order[] = dbOrders.map((order) => ({
        id: order.id,
        listing_id: order.listing_id,
        crop_type: "Crop", // TODO: Join with listings table
        quantity: Number(order.quantity),
        unit: "kg",
        unit_price: Number(order.unit_price),
        total_amount: Number(order.total_amount),
        farmer_name: order.buyer_name || "Farmer",
        farmer_address: order.farmer_address || "",
        payment_status: order.payment_status,
        delivery_status: order.delivery_status,
        order_date: new Date(order.created_at).toISOString().split('T')[0],
        delivery_date: order.delivery_date,
        image_url: undefined,
      }));

      setOrders(transformedOrders);

      // Update profile stats
      if (buyerProfile) {
        const totalSpent = transformedOrders.reduce((sum, o) => sum + o.total_amount, 0);
        setProfile(prev => prev ? {
          ...prev,
          total_spent: totalSpent,
          total_orders: transformedOrders.length,
        } : null);
      }

      // Load marketplace listings
      const listings = await getMarketplaceListings();
      setMarketplaceListings(listings.filter(l => l.status === 'active'));
    } catch (error) {
      console.error('Error loading buyer data:', error);
      toast.error('Failed to load buyer data');
    }
  };

  const handleSaveProfile = async () => {
    if (!evmAddress || !profile) return;

    if (!profile.name || !profile.delivery_address) {
      toast.error("Name and Delivery Address are required");
      return;
    }

    try {
      toast.loading("Saving profile...", { id: "save-profile" });
      await createOrUpdateBuyerProfile({
        wallet_address: evmAddress,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        company_name: profile.company_name,
        delivery_address: profile.delivery_address,
        country: "Zambia", // Default
        verified: profile.verified
      });
      toast.dismiss("save-profile");
      toast.success("Profile saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.dismiss("save-profile");
      toast.error("Failed to save profile");
    }
  };

  const stats = {
    totalOrders: orders.length,
    pendingPayments: orders.filter(o => o.payment_status === "pending").length,
    completedOrders: orders.filter(o => o.delivery_status === "delivered").length,
    totalSpent: orders.reduce((sum, o) => sum + o.total_amount, 0),
  };

  const handlePayNow = (order: Order) => {
    setSelectedOrderForPayment(order);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (transactionHash: string) => {
    if (!selectedOrderForPayment) return;

    try {
      // Update order status in Supabase
      const { updateMarketplaceOrder } = await import('@/lib/database');
      await updateMarketplaceOrder(selectedOrderForPayment.id, {
        payment_status: 'completed',
        payment_tx_hash: transactionHash
      });

      // Update local state
      setOrders(prev => prev.map(o =>
        o.id === selectedOrderForPayment.id
          ? { ...o, payment_status: "completed" }
          : o
      ));

      toast.success("Order payment completed!");
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    }
  };

  const handleOrderClick = (orderId: string) => {
    setActiveTab("orders");
    setSearchQuery("");
    setFilterStatus("all");
    toast.success(`Viewing details for Order #${orderId}`);
  };

  const handlePlaceOrder = async (listing: any) => {
    if (!evmAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!profile || !profile.name || !profile.delivery_address) {
      toast.error("Please complete your profile (Name & Address) to place an order");
      setActiveTab("profile");
      setSelectedListing(null);
      return;
    }

    if (orderQuantity <= 0 || orderQuantity > listing.available_quantity) {
      toast.error("Invalid quantity");
      return;
    }

    try {
      // Use the centralized function instead of raw insert
      const { createMarketplaceOrder } = await import('@/lib/database');

      console.log("Placing order for:", listing);

      const totalAmount = orderQuantity * listing.price_per_unit;

      const newOrder = await createMarketplaceOrder({
        listing_id: listing.id,
        buyer_address: evmAddress,
        buyer_name: profile.name,
        farmer_address: listing.farmer_address,
        quantity: orderQuantity,
        unit_price: listing.price_per_unit,
        total_amount: totalAmount,
        payment_status: 'pending',
        delivery_status: 'pending',
        delivery_address: profile.delivery_address,
      });

      console.log("Order placed:", newOrder);

      toast.success("Order placed successfully! proceeding to payment...");
      setSelectedListing(null);
      setOrderQuantity(1);

      // Refresh data
      await loadBuyerData();

      // Construct full order object for state (combine DB result with listing info)
      const fullOrder: Order = {
        ...newOrder,
        crop_type: listing.crop_type,
        unit: listing.unit,
        farmer_name: listing.farmer_name || 'Unknown Farmer', // Fallback
        order_date: new Date(newOrder.created_at).toISOString().split('T')[0], // Format date
        id: newOrder.id,
        listing_id: newOrder.listing_id,
        payment_status: newOrder.payment_status,
        delivery_status: newOrder.delivery_status,
        quantity: newOrder.quantity,
        unit_price: newOrder.unit_price,
        total_amount: newOrder.total_amount,
        farmer_address: newOrder.farmer_address,
        image_url: listing.image_url, // Add image URL from listing
        delivery_date: undefined, // Assuming delivery_date is set later
      };

      // Auto-open payment modal
      setSelectedOrderForPayment(fullOrder);
      setShowPaymentModal(true);

      setActiveTab("orders");

    } catch (error: any) {
      console.error("Error placing order:", error);
      // Log detailed error
      if (error && typeof error === 'object') {
        console.error("Error details:", JSON.stringify(error, null, 2));
      }
      toast.error(`Failed to place order: ${error.message || 'Unknown error'}`);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === "all" ||
      order.payment_status === filterStatus ||
      order.delivery_status === filterStatus;
    const matchesSearch = order.crop_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.farmer_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Buyer Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your purchases and orders</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">Verified Buyer</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-6 border-b border-gray-200">
            {[
              { id: "overview", label: "Overview", icon: TrendingUp },
              { id: "marketplace", label: "Marketplace", icon: Store },
              { id: "orders", label: "My Orders", icon: ShoppingBag },
              { id: "profile", label: "Profile", icon: User },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-3 font-medium transition-all relative ${activeTab === tab.id
                    ? "text-green-600"
                    : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <ShoppingBag className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-500">Total</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
                <p className="text-sm text-gray-600 mt-1">Total Orders</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <span className="text-sm text-gray-500">Pending</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingPayments}</p>
                <p className="text-sm text-gray-600 mt-1">Pending Payments</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-500">Completed</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.completedOrders}</p>
                <p className="text-sm text-gray-600 mt-1">Delivered Orders</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-500">Total</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">K{stats.totalSpent.toLocaleString()}</p>
                <p className="text-sm text-gray-600 mt-1">Total Spent</p>
              </motion.div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {orders.slice(0, 5).map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleOrderClick(order.id)}
                    className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {order.image_url && (
                          <img
                            src={order.image_url}
                            alt={order.crop_type}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">{order.crop_type}</h3>
                          <p className="text-sm text-gray-600">
                            {order.quantity} {order.unit} from {order.farmer_name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{order.order_date}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center space-x-3">
                        <div>
                          <p className="text-lg font-bold text-gray-900">K{order.total_amount.toLocaleString()}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.payment_status === "completed"
                              ? "bg-green-100 text-green-700"
                              : order.payment_status === "pending"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-blue-100 text-blue-700"
                              }`}>
                              {order.payment_status}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.delivery_status === "delivered"
                              ? "bg-green-100 text-green-700"
                              : order.delivery_status === "in_transit"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                              }`}>
                              {order.delivery_status}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Marketplace Tab */}
        {activeTab === "marketplace" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Browse Marketplace</h2>
                  <p className="text-gray-600 mt-1">Fresh produce directly from verified farmers</p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Package className="h-5 w-5" />
                  <span>{marketplaceListings.length} listings available</span>
                </div>
              </div>

              {/* Marketplace Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketplaceListings.map((listing, index) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl border-2 border-gray-100 hover:border-green-300 hover:shadow-lg transition-all overflow-hidden group"
                  >
                    {/* Listing Image Placeholder */}
                    <div className="h-48 bg-gradient-to-br from-green-100 to-emerald-50 flex items-center justify-center">
                      <Leaf className="h-16 w-16 text-green-600 opacity-50" />
                    </div>

                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{listing.crop_type}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            <MapPin className="inline h-3 w-3 mr-1" />
                            {listing.location || 'Zambia'}
                          </p>
                        </div>
                        {listing.organic && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                            <Leaf className="h-3 w-3 text-green-600" />
                            <span className="text-xs font-medium text-green-700">Organic</span>
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Available:</span>
                          <span className="font-semibold text-gray-900">{listing.available_quantity} kg</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Quality:</span>
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4 text-yellow-500" />
                            <span className="font-semibold text-gray-900">{listing.quality_grade}</span>
                          </div>
                        </div>
                        {listing.harvest_date && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Harvested:</span>
                            <span className="font-semibold text-gray-900">
                              {new Date(listing.harvest_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {listing.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {listing.description}
                        </p>
                      )}

                      {/* Price and Action */}
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-end justify-between mb-3">
                          <div>
                            <p className="text-xs text-gray-500">Price per kg</p>
                            <p className="text-2xl font-bold text-green-600">K{listing.price_per_unit}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Total Value</p>
                            <p className="text-lg font-bold text-gray-900">K{listing.total_price.toLocaleString()}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedListing(listing);
                            setOrderQuantity(Math.min(1, listing.available_quantity));
                          }}
                          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          <span>Order Now</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {marketplaceListings.length === 0 && (
                <div className="text-center py-12">
                  <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No listings available</h3>
                  <p className="text-gray-600">Check back later for fresh produce from our farmers</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All Orders</option>
                    <option value="pending">Pending Payment</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Orders List */}
            <div className="grid gap-6">
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        {order.image_url && (
                          <img
                            src={order.image_url}
                            alt={order.crop_type}
                            className="w-24 h-24 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{order.crop_type}</h3>
                          <p className="text-gray-600 mt-1">
                            {order.quantity} {order.unit} @ K{order.unit_price}/{order.unit}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{order.farmer_name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">K{order.total_amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 mt-1">Order #{order.id}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Order Date</p>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{order.order_date}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Payment Status</p>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${order.payment_status === "completed"
                          ? "bg-green-100 text-green-700"
                          : order.payment_status === "pending"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                          }`}>
                          {order.payment_status}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Delivery Status</p>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${order.delivery_status === "delivered"
                          ? "bg-green-100 text-green-700"
                          : order.delivery_status === "in_transit"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                          }`}>
                          {order.delivery_status}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="font-mono text-xs">
                          {order.farmer_address && order.farmer_address.length > 10
                            ? `${order.farmer_address.slice(0, 10)}...${order.farmer_address.slice(-8)}`
                            : order.farmer_address || "Unknown"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-2">
                          <Eye className="h-4 w-4" />
                          <span>View Details</span>
                        </button>
                        {order.payment_status === "pending" && order.farmer_address && (
                          <button
                            onClick={() => handlePayNow(order)}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center space-x-2"
                          >
                            <DollarSign className="h-4 w-4" />
                            <span>Pay Now</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && profile && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Profile Info */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="inline h-4 w-4 mr-2" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="inline h-4 w-4 mr-2" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="inline h-4 w-4 mr-2" />
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building className="inline h-4 w-4 mr-2" />
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={profile.company_name}
                      onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="inline h-4 w-4 mr-2" />
                      Delivery Address
                    </label>
                    <textarea
                      value={profile.delivery_address}
                      onChange={(e) => setProfile({ ...profile, delivery_address: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSaveProfile}
                  className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>

            {/* Stats Card */}
            <div className="space-y-6">
              {/* Wallet Balance Component */}
              <WalletBalance
                walletAddress={evmAddress || ''}
                userRole="buyer"
                userName={profile.name}
                userEmail={profile.email}
                userPhone={profile.phone}
              />

            </div>
          </div>
        )}
      </div>

      {/* Order Modal */}
      {selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Place Order</h3>
              <button
                onClick={() => {
                  setSelectedListing(null);
                  setOrderQuantity(1);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Product Info */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-bold text-gray-900 mb-2">{selectedListing.crop_type}</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Quality: {selectedListing.quality_grade}</p>
                  <p>Available: {selectedListing.available_quantity} kg</p>
                  <p>Price: K{selectedListing.price_per_unit}/kg</p>
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity (kg)
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedListing.available_quantity}
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(Math.max(1, Math.min(selectedListing.available_quantity, parseInt(e.target.value) || 1)))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Total */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Total Amount:</span>
                  <span className="text-2xl font-bold text-green-600">
                    K{(orderQuantity * selectedListing.price_per_unit).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handlePlaceOrder(selectedListing)}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  Confirm Order
                </button>
                <button
                  onClick={() => {
                    setSelectedListing(null);
                    setOrderQuantity(1);
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Payment Modal */}
      {selectedOrderForPayment && (
        <PaymentModal
          isOpen={showPaymentModal}
          onCloseAction={() => {
            setShowPaymentModal(false);
            setSelectedOrderForPayment(null);
          }}
          order={{
            id: selectedOrderForPayment.id,
            crop_type: selectedOrderForPayment.crop_type,
            quantity: selectedOrderForPayment.quantity,
            unit: selectedOrderForPayment.unit,
            total_amount: selectedOrderForPayment.total_amount,
            farmer_name: selectedOrderForPayment.farmer_name,
            farmer_address: selectedOrderForPayment.farmer_address,
          }}
          onSuccessAction={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
