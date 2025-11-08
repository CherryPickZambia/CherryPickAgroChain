"use client";

import { useState, useEffect } from "react";
import { Search, Filter, ShoppingCart, TrendingUp, Package, Truck, Clock, DollarSign, MapPin, Star, Heart, MessageCircle, ChevronDown, ChevronUp, User, CheckCircle, Eye, Plus } from "lucide-react";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

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
  cropType: string;
  quantity: number;
  targetPrice: number;
  deliveryDate: string;
  location: string;
  status: "open" | "matched" | "completed";
  bids: number;
}

export default function Marketplace() {
  const { evmAddress } = useEvmAddress();
  const [activeTab, setActiveTab] = useState<"browse" | "bulk" | "auction">("browse");
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [bulkOrders, setBulkOrders] = useState<BulkOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [cart, setCart] = useState<Array<{id: string, listing: MarketplaceListing}>>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Mock data - Replace with actual Supabase queries
  useEffect(() => {
    loadMarketplaceData();
  }, []);

  const loadMarketplaceData = async () => {
    // Mock listings
    const mockListings: MarketplaceListing[] = [
      {
        id: "1",
        farmerId: "farmer1",
        farmerName: "John Mwale",
        farmerRating: 4.8,
        cropType: "Mangoes",
        variety: "Kent",
        quantity: 500,
        pricePerKg: 18,
        location: "Lusaka, Zambia",
        harvestDate: "2024-12-15",
        quality: "Premium",
        certifications: ["Organic", "GlobalGAP"],
        images: ["/mango1.jpg"],
        description: "Premium Kent mangoes, organically grown",
        deliveryOptions: ["Farm Pickup", "Delivery Available"],
      },
      {
        id: "2",
        farmerId: "farmer2",
        farmerName: "Mary Banda",
        farmerRating: 4.9,
        cropType: "Tomatoes",
        variety: "Roma",
        quantity: 1000,
        pricePerKg: 12,
        location: "Kabwe, Zambia",
        harvestDate: "2024-11-20",
        quality: "Grade A",
        certifications: ["HACCP"],
        images: ["/tomato1.jpg"],
        description: "Fresh Roma tomatoes for processing",
        deliveryOptions: ["Farm Pickup", "Delivery Available", "Bulk Transport"],
      },
    ];

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

    setListings(mockListings);
    setBulkOrders(mockBulkOrders);
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">Marketplace</h1>
        <p className="text-gray-600">Buy and sell agricultural produce directly</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("browse")}
          className={`pb-4 px-2 font-semibold transition-colors ${
            activeTab === "browse"
              ? "text-[#2d5f3f] border-b-2 border-[#2d5f3f]"
              : "text-gray-600 hover:text-[#2d5f3f]"
          }`}
        >
          Browse Products
        </button>
        <button
          onClick={() => setActiveTab("bulk")}
          className={`pb-4 px-2 font-semibold transition-colors ${
            activeTab === "bulk"
              ? "text-[#2d5f3f] border-b-2 border-[#2d5f3f]"
              : "text-gray-600 hover:text-[#2d5f3f]"
          }`}
        >
          Bulk Orders
        </button>
        <button
          onClick={() => setActiveTab("auction")}
          className={`pb-4 px-2 font-semibold transition-colors ${
            activeTab === "auction"
              ? "text-[#2d5f3f] border-b-2 border-[#2d5f3f]"
              : "text-gray-600 hover:text-[#2d5f3f]"
          }`}
        >
          Auctions
        </button>
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
          <div className="card-premium p-6">
            <h3 className="text-xl font-bold text-[#1a1a1a] mb-4">Create Bulk Order Request</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Crop Type"
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                placeholder="Quantity (kg)"
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                placeholder="Target Price (K/kg)"
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="date"
                placeholder="Delivery Date"
                className="px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <button className="mt-4 btn-primary">
              Post Bulk Order Request
            </button>
          </div>

          {/* Active Bulk Orders */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#1a1a1a]">Active Bulk Orders</h3>
            {bulkOrders.map((order) => (
              <div key={order.id} className="card-premium p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-[#1a1a1a] mb-2">{order.cropType}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        <span>{order.quantity} kg</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>K{order.targetPrice}/kg</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(order.deliveryDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{order.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="badge badge-success">{order.status}</span>
                    <p className="text-sm text-gray-600 mt-2">{order.bids} bids</p>
                  </div>
                </div>
                <button className="btn-primary">
                  Place Bid
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
