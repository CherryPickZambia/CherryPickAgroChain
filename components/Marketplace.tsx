"use client";

import { useState, useEffect } from "react";
import { Search, Filter, ShoppingCart, TrendingUp, Package, Truck, Clock, DollarSign, MapPin, Star, Heart, MessageCircle, ChevronDown, ChevronUp, User, CheckCircle, Eye, Plus, X, Send, Gavel, Calendar, Target, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { getMarketplaceListings, createMarketplaceOrder, type MarketplaceListing as DBListing } from "@/lib/database";

// Sample bulk orders data
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
    description: "Looking for premium quality Kent mangoes for export. Must be Grade A or Premium."
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
    description: "Need fresh roma tomatoes for processing. Regular supply preferred."
  },
  {
    id: "bulk-3",
    buyerId: "buyer-3",
    buyerName: "Agro Exports Zambia",
    cropType: "Cashew nuts",
    quantity: 1000,
    targetPrice: 120,
    deliveryDate: "2024-12-15",
    location: "Chipata",
    status: "open",
    bids: 2,
    description: "Premium raw cashews W320 grade for international export."
  },
  {
    id: "bulk-4",
    buyerId: "buyer-4",
    buyerName: "Local Grocers Association",
    cropType: "Bananas",
    quantity: 3000,
    targetPrice: 8,
    deliveryDate: "2024-11-30",
    location: "Kitwe",
    status: "open",
    bids: 4,
    description: "Cavendish bananas for retail distribution across Copperbelt."
  },
];

interface MarketplaceListing {
  id: string;
  farmerId: string;
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

export default function Marketplace() {
  const { evmAddress } = useEvmAddress();
  const [activeTab, setActiveTab] = useState<"browse" | "bulk" | "auction">("browse");
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [bulkOrders, setBulkOrders] = useState<BulkOrder[]>(SAMPLE_BULK_ORDERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [cart, setCart] = useState<Array<{ id: string, listing: MarketplaceListing }>>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Bulk order form state
  const [bulkOrderForm, setBulkOrderForm] = useState<BulkOrderForm>({
    cropType: "",
    quantity: "",
    targetPrice: "",
    deliveryDate: "",
    location: "",
    description: ""
  });

  // Bid modal state
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedBulkOrder, setSelectedBulkOrder] = useState<BulkOrder | null>(null);
  const [bidForm, setBidForm] = useState<BidForm>({
    price: "",
    quantity: "",
    message: ""
  });

  // Handle bulk order form submission
  const handleCreateBulkOrder = () => {
    if (!bulkOrderForm.cropType || !bulkOrderForm.quantity || !bulkOrderForm.targetPrice || !bulkOrderForm.deliveryDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newOrder: BulkOrder = {
      id: `bulk-${Date.now()}`,
      buyerId: evmAddress || "anonymous",
      buyerName: "Your Order",
      cropType: bulkOrderForm.cropType,
      quantity: parseInt(bulkOrderForm.quantity),
      targetPrice: parseFloat(bulkOrderForm.targetPrice),
      deliveryDate: bulkOrderForm.deliveryDate,
      location: bulkOrderForm.location || "Zambia",
      status: "open",
      bids: 0,
      description: bulkOrderForm.description
    };

    setBulkOrders([newOrder, ...bulkOrders]);
    setBulkOrderForm({
      cropType: "",
      quantity: "",
      targetPrice: "",
      deliveryDate: "",
      location: "",
      description: ""
    });
    toast.success("Bulk order request posted successfully!");
  };

  // Handle placing a bid
  const handlePlaceBid = () => {
    if (!bidForm.price || !bidForm.quantity) {
      toast.error("Please enter price and quantity");
      return;
    }

    if (selectedBulkOrder) {
      // Update the order with new bid count
      setBulkOrders(prev => prev.map(order =>
        order.id === selectedBulkOrder.id
          ? { ...order, bids: order.bids + 1 }
          : order
      ));

      toast.success(`Bid placed successfully! You offered K${bidForm.price}/kg for ${bidForm.quantity}kg`);
      setShowBidModal(false);
      setSelectedBulkOrder(null);
      setBidForm({ price: "", quantity: "", message: "" });
    }
  };

  // Open bid modal
  const openBidModal = (order: BulkOrder) => {
    setSelectedBulkOrder(order);
    setBidForm({
      price: order.targetPrice.toString(),
      quantity: Math.min(1000, order.quantity).toString(),
      message: ""
    });
    setShowBidModal(true);
  };

  // Load real data from Supabase
  useEffect(() => {
    loadMarketplaceData();
  }, [selectedCategory, sortBy]);

  const loadMarketplaceData = async () => {
    try {
      // Fetch real listings from Supabase
      const filters: any = { status: 'active' };

      if (selectedCategory !== 'all') {
        filters.crop_type = selectedCategory;
      }

      const dbListings = await getMarketplaceListings(filters);

      // Transform database listings to component format
      const transformedListings: MarketplaceListing[] = dbListings.map((listing: DBListing) => {
        // Map quality grades to component format
        let quality: "Premium" | "Grade A" | "Grade B" = "Grade A";
        if (listing.quality_grade === "Premium") quality = "Premium";
        else if (listing.quality_grade === "A") quality = "Grade A";
        else if (listing.quality_grade === "B" || listing.quality_grade === "C") quality = "Grade B";

        return {
          id: listing.id,
          farmerId: listing.farmer_id,
          farmerName: "Farmer", // TODO: Join with farmers table
          farmerRating: 4.5,
          cropType: listing.crop_type,
          variety: listing.crop_type,
          quantity: Number(listing.available_quantity),
          pricePerKg: Number(listing.price_per_unit),
          location: listing.location || "Zambia",
          harvestDate: listing.harvest_date || new Date().toISOString().split('T')[0],
          quality,
          certifications: listing.organic ? ["Organic"] : [],
          images: listing.image_url ? [listing.image_url] : [],
          description: listing.description || "",
          deliveryOptions: ["Farm Pickup", "Delivery Available"],
        };
      });

      // Sort listings
      const sorted = [...transformedListings].sort((a, b) => {
        if (sortBy === 'price-low') return a.pricePerKg - b.pricePerKg;
        if (sortBy === 'price-high') return b.pricePerKg - a.pricePerKg;
        if (sortBy === 'quantity') return b.quantity - a.quantity;
        return 0; // newest (default from database)
      });

      setListings(sorted);

      // Mock bulk orders for now
      const mockBulkOrders: BulkOrder[] = [
        {
          id: "bulk1",
          buyerId: "buyer1",
          cropType: "Mangoes",
          quantity: 2000,
          targetPrice: 16,
          deliveryDate: "2024-12-01",
          location: "Lusaka",
          status: "open",
          bids: 3,
        },
        {
          id: "bulk2",
          buyerId: "buyer2",
          cropType: "Tomatoes",
          quantity: 5000,
          targetPrice: 10,
          deliveryDate: "2024-11-25",
          location: "Ndola",
          status: "open",
          bids: 5,
        },
      ];

      setBulkOrders(mockBulkOrders);
    } catch (error) {
      console.error('Error loading marketplace data:', error);
      toast.error('Failed to load marketplace listings');
      setListings([]);
    }
  };

  const addToCart = (listingId: string) => {
    const listing = listings.find(l => l.id === listingId);
    if (!listing) {
      toast.error("Product not found!");
      return;
    }

    // Check if already in cart
    const existingItem = cart.find(item => item.id === listingId);
    if (existingItem) {
      toast.error("Already in cart!");
      return;
    }

    setCart([...cart, { id: listingId, listing }]);
    toast.success(`${listing.cropType} added to cart!`);
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.cropType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.variety.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || listing.cropType === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Premium Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Marketplace
              </h1>
            </div>
            <p className="text-gray-500">Discover fresh produce directly from verified farmers</p>
          </div>

          {/* Cart Preview */}
          {cart.length > 0 && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200"
            >
              <ShoppingCart className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold text-emerald-700">{cart.length} items</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Premium Tabs */}
      <div className="flex gap-2 mb-8 p-1.5 bg-gray-100/80 rounded-xl w-fit">
        {[
          { id: "browse", label: "Browse Products", icon: Package },
          { id: "bulk", label: "Bulk Orders", icon: Truck },
          { id: "auction", label: "Auctions", icon: TrendingUp },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`relative px-5 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${activeTab === tab.id
              ? "bg-white text-emerald-700 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
              }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Browse Products Tab */}
      {activeTab === "browse" && (
        <div>
          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Filter className="h-5 w-5" />
                Filters
                {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>

            {showFilters && (
              <div className="card-premium p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="all">All Categories</option>
                      <option value="Mangoes">Mangoes</option>
                      <option value="Tomatoes">Tomatoes</option>
                      <option value="Pineapples">Pineapples</option>
                      <option value="Cashew nuts">Cashew Nuts</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="newest">Newest First</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="rating">Highest Rated</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quality</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                      <option value="all">All Grades</option>
                      <option value="premium">Premium</option>
                      <option value="gradeA">Grade A</option>
                      <option value="gradeB">Grade B</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <div key={listing.id} className="card-premium hover:shadow-2xl transition-all group">
                {/* Product Image */}
                <div className="relative h-48 bg-gradient-to-br from-green-100 to-green-50 rounded-xl mb-4 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package className="h-20 w-20 text-green-300" />
                  </div>
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50">
                      <Heart className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="badge badge-success">{listing.quality}</span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-[#1a1a1a] mb-1">
                      {listing.cropType} - {listing.variety}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{listing.location}</span>
                    </div>
                  </div>

                  {/* Farmer Info */}
                  <div className="flex items-center justify-between py-2 border-y border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-green-700">
                          {listing.farmerName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{listing.farmerName}</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="text-xs text-gray-600">{listing.farmerRating}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quantity and Price */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Available</p>
                      <p className="text-lg font-bold text-[#1a1a1a]">{listing.quantity} kg</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Price</p>
                      <p className="text-2xl font-bold text-[#2d5f3f]">K{listing.pricePerKg}/kg</p>
                    </div>
                  </div>

                  {/* Certifications */}
                  {listing.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {listing.certifications.map((cert, index) => (
                        <span key={index} className="badge badge-info text-xs">
                          {cert}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => addToCart(listing.id)}
                      className="flex-1 bg-[#2d5f3f] hover:bg-[#1d4029] text-white py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Add to Cart
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <MessageCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Orders Tab */}
      {activeTab === "bulk" && (
        <div className="space-y-6">
          {/* Create Bulk Order Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Create Bulk Order Request</h3>
                <p className="text-sm text-gray-500">Post your requirements and receive bids from farmers</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Crop Type *</label>
                <select
                  value={bulkOrderForm.cropType}
                  onChange={(e) => setBulkOrderForm({ ...bulkOrderForm, cropType: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select crop...</option>
                  <option value="Mangoes">Mangoes</option>
                  <option value="Tomatoes">Tomatoes</option>
                  <option value="Pineapples">Pineapples</option>
                  <option value="Cashew nuts">Cashew nuts</option>
                  <option value="Bananas">Bananas</option>
                  <option value="Beetroot">Beetroot</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg) *</label>
                <input
                  type="number"
                  placeholder="e.g., 1000"
                  value={bulkOrderForm.quantity}
                  onChange={(e) => setBulkOrderForm({ ...bulkOrderForm, quantity: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Price (K/kg) *</label>
                <input
                  type="number"
                  placeholder="e.g., 15"
                  value={bulkOrderForm.targetPrice}
                  onChange={(e) => setBulkOrderForm({ ...bulkOrderForm, targetPrice: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date *</label>
                <input
                  type="date"
                  value={bulkOrderForm.deliveryDate}
                  onChange={(e) => setBulkOrderForm({ ...bulkOrderForm, deliveryDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Location</label>
                <select
                  value={bulkOrderForm.location}
                  onChange={(e) => setBulkOrderForm({ ...bulkOrderForm, location: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select location...</option>
                  <option value="Lusaka">Lusaka</option>
                  <option value="Ndola">Ndola</option>
                  <option value="Kitwe">Kitwe</option>
                  <option value="Kabwe">Kabwe</option>
                  <option value="Livingstone">Livingstone</option>
                  <option value="Chipata">Chipata</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Additional requirements..."
                  value={bulkOrderForm.description}
                  onChange={(e) => setBulkOrderForm({ ...bulkOrderForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={handleCreateBulkOrder}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Post Bulk Order Request
            </button>
          </motion.div>

          {/* Active Bulk Orders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Active Bulk Orders</h3>
              <span className="text-sm text-gray-500">{bulkOrders.length} open requests</span>
            </div>

            {bulkOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-xl font-bold text-gray-900">{order.cropType}</h4>
                      {order.buyerName && (
                        <span className="text-sm text-gray-500">by {order.buyerName}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-lg">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{order.quantity.toLocaleString()} kg</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-lg">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium text-emerald-700">K{order.targetPrice}/kg</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 rounded-lg">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-700">{new Date(order.deliveryDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 rounded-lg">
                        <MapPin className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-purple-700">{order.location}</span>
                      </div>
                    </div>
                    {order.description && (
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mb-3">
                        "{order.description}"
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${order.status === 'open'
                      ? 'bg-emerald-100 text-emerald-700'
                      : order.status === 'matched'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                      }`}>
                      {order.status.toUpperCase()}
                    </span>
                    <p className="text-sm text-gray-500 mt-2">{order.bids} bids</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500">
                    Total Value: <span className="font-semibold text-gray-900">K{(order.quantity * order.targetPrice).toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => openBidModal(order)}
                    className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md flex items-center gap-2"
                  >
                    <Gavel className="h-4 w-4" />
                    Place Bid
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Bid Modal */}
      <AnimatePresence>
        {showBidModal && selectedBulkOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBidModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              >
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold">Place a Bid</h3>
                      <p className="text-emerald-100 text-sm mt-1">{selectedBulkOrder.cropType} • {selectedBulkOrder.quantity.toLocaleString()} kg needed</p>
                    </div>
                    <button
                      onClick={() => setShowBidModal(false)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Buyer's Target Price:</span>
                      <span className="font-bold text-gray-900">K{selectedBulkOrder.targetPrice}/kg</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium text-gray-900">{selectedBulkOrder.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-600">Delivery by:</span>
                      <span className="font-medium text-gray-900">{new Date(selectedBulkOrder.deliveryDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Price (K/kg) *</label>
                    <input
                      type="number"
                      value={bidForm.price}
                      onChange={(e) => setBidForm({ ...bidForm, price: e.target.value })}
                      placeholder="Enter your price per kg"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity You Can Supply (kg) *</label>
                    <input
                      type="number"
                      value={bidForm.quantity}
                      onChange={(e) => setBidForm({ ...bidForm, quantity: e.target.value })}
                      placeholder="How much can you provide?"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
                    <textarea
                      value={bidForm.message}
                      onChange={(e) => setBidForm({ ...bidForm, message: e.target.value })}
                      placeholder="Add any additional info about your produce..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>

                  {bidForm.price && bidForm.quantity && (
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                      <p className="text-sm text-emerald-800">
                        <span className="font-semibold">Your Bid Summary:</span> K{bidForm.price}/kg × {parseInt(bidForm.quantity).toLocaleString()} kg =
                        <span className="font-bold"> K{(parseFloat(bidForm.price) * parseInt(bidForm.quantity)).toLocaleString()}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={() => setShowBidModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePlaceBid}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Gavel className="h-4 w-4" />
                    Submit Bid
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Auctions Tab */}
      {activeTab === "auction" && (
        <div className="text-center py-16">
          <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-[#1a1a1a] mb-2">Auctions Coming Soon</h3>
          <p className="text-gray-600 mb-8">
            Real-time bidding for premium agricultural produce
          </p>
          <button className="btn-primary">
            Get Notified
          </button>
        </div>
      )}

      {/* Cart Badge */}
      {cart.length > 0 && (
        <div className="fixed bottom-8 right-8 z-50">
          <button
            onClick={() => toast.success(`You have ${cart.length} item(s) in cart. Cart checkout coming soon!`)}
            className="bg-[#2d5f3f] hover:bg-[#1d4029] text-white p-4 rounded-full shadow-2xl flex items-center gap-2 relative group"
          >
            <ShoppingCart className="h-6 w-6" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {cart.length}
            </span>
            <span className="absolute bottom-full mb-2 right-0 bg-gray-900 text-white text-sm py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              View Cart ({cart.length} items)
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
