"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ShoppingBag, Package, Clock, CheckCircle, TrendingUp, 
  DollarSign, MapPin, User, Mail, Phone, Building, 
  Calendar, Filter, Search, Eye, Download, ArrowRight
} from "lucide-react";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import PaymentModal from "./PaymentModal";
import toast from "react-hot-toast";

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
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "profile">("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<BuyerProfile | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Mock data - replace with real API calls
  useEffect(() => {
    // Simulate API call
    setProfile({
      name: "John Buyer",
      email: "john@example.com",
      phone: "+260 97 123 4567",
      company_name: "Fresh Foods Ltd",
      delivery_address: "123 Market Street, Lusaka",
      total_spent: 45000,
      total_orders: 28,
      verified: true,
    });

    setOrders([
      {
        id: "1",
        listing_id: "L1",
        crop_type: "Tomatoes",
        quantity: 500,
        unit: "kg",
        unit_price: 15,
        total_amount: 7500,
        farmer_name: "Mary Banda",
        farmer_address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        payment_status: "completed",
        delivery_status: "delivered",
        order_date: "2024-11-01",
        delivery_date: "2024-11-05",
        image_url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80",
      },
      {
        id: "2",
        listing_id: "L2",
        crop_type: "Mangoes",
        quantity: 200,
        unit: "kg",
        unit_price: 25,
        total_amount: 5000,
        farmer_name: "Peter Phiri",
        farmer_address: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
        payment_status: "pending",
        delivery_status: "preparing",
        order_date: "2024-11-06",
        image_url: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80",
      },
      {
        id: "3",
        listing_id: "L3",
        crop_type: "Pineapples",
        quantity: 150,
        unit: "kg",
        unit_price: 20,
        total_amount: 3000,
        farmer_name: "John Mwale",
        farmer_address: "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8",
        payment_status: "processing",
        delivery_status: "in_transit",
        order_date: "2024-11-04",
        delivery_date: "2024-11-08",
        image_url: "https://images.unsplash.com/photo-1550828520-4cb496926fc9?w=400&q=80",
      },
    ]);
  }, [evmAddress]);

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

    // TODO: Update order status in Supabase
    // await supabase.from('marketplace_orders')
    //   .update({ 
    //     payment_status: 'completed',
    //     payment_tx_hash: transactionHash 
    //   })
    //   .eq('id', selectedOrderForPayment.id);

    // Update local state
    setOrders(prev => prev.map(o => 
      o.id === selectedOrderForPayment.id 
        ? { ...o, payment_status: "completed" }
        : o
    ));

    toast.success("Order payment completed!");
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
              { id: "orders", label: "My Orders", icon: ShoppingBag },
              { id: "profile", label: "Profile", icon: User },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-3 font-medium transition-all relative ${
                    activeTab === tab.id
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
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
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
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">K{order.total_amount.toLocaleString()}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            order.payment_status === "completed"
                              ? "bg-green-100 text-green-700"
                              : order.payment_status === "pending"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {order.payment_status}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            order.delivery_status === "delivered"
                              ? "bg-green-100 text-green-700"
                              : order.delivery_status === "in_transit"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}>
                            {order.delivery_status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
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
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          order.payment_status === "completed"
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
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          order.delivery_status === "delivered"
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
                        <span className="font-mono text-xs">{order.farmer_address.slice(0, 10)}...{order.farmer_address.slice(-8)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-2">
                          <Eye className="h-4 w-4" />
                          <span>View Details</span>
                        </button>
                        {order.payment_status === "pending" && (
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
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <button className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>

            {/* Stats Card */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Buyer Stats</h3>
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-green-100 text-sm">Total Orders</p>
                    <p className="text-3xl font-bold">{profile.total_orders}</p>
                  </div>
                  <div>
                    <p className="text-green-100 text-sm">Total Spent</p>
                    <p className="text-3xl font-bold">K{profile.total_spent.toLocaleString()}</p>
                  </div>
                  <div className="pt-4 border-t border-green-500">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Verified Buyer</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Wallet Address</h3>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-mono text-gray-600 break-all">{evmAddress}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {selectedOrderForPayment && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
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
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
