"use client";

import { useState } from "react";
import { Users, FileText, TrendingUp, DollarSign, Activity, ArrowUp, MapPin, Clock, CheckCircle2, Settings, Package, Search, Plus, Sun, Menu, ShoppingBag, User } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminDashboard() {
  const [selectedView, setSelectedView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Cost analysis data
  const costData = [
    { month: "Jan", cost: 150 },
    { month: "Feb", cost: 180 },
    { month: "Mar", cost: 220 },
    { month: "Apr", cost: 310 },
    { month: "May", cost: 280 },
    { month: "Jun", cost: 300 },
    { month: "Jul", cost: 350 },
    { month: "Aug", cost: 386.5 },
  ];

  // Crop distribution data
  const cropData = [
    { name: "Mangoes", value: 8500, percentage: 35, color: "#10b981" },
    { name: "Tomatoes", value: 6200, percentage: 28, color: "#f59e0b" },
    { name: "Pineapples", value: 4800, percentage: 22, color: "#ef4444" },
    { name: "Cashews", value: 3200, percentage: 15, color: "#8b5cf6" },
  ];

  const stats = {
    totalFarmers: { value: 156, subtitle: "Active Farmers" },
    activeContracts: { value: 89, subtitle: "Active Contracts" },
    marketplaceListings: { value: 234, subtitle: "Active Listings" },
    totalRevenue: { value: "K2.5M", subtitle: "Platform Revenue" },
  };

  const menuItems = [
    { icon: Activity, label: "Dashboard", id: "dashboard" },
    { icon: ShoppingBag, label: "Marketplace", id: "marketplace" },
    { icon: FileText, label: "Contracts", id: "contracts" },
    { icon: Users, label: "Farmers", id: "farmers" },
    { icon: User, label: "Buyers", id: "buyers" },
    { icon: CheckCircle2, label: "Officers", id: "officers" },
    { icon: TrendingUp, label: "Analytics", id: "analytics" },
    { icon: DollarSign, label: "Payments", id: "payments" },
    { icon: Settings, label: "Settings", id: "settings" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-20"
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">▶</span>
            </div>
            <span className="text-xl font-bold text-gray-800">Dashboard</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = selectedView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "marketplace") {
                    window.location.href = "/marketplace";
                  } else {
                    setSelectedView(item.id);
                  }
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-green-50 text-green-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-green-600" : "text-gray-400"}`} />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-lg">
              <Sun className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-700">18°C</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">FS</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Fletch Skinner</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {selectedView === "dashboard" && (
            <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Fields */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Farmers</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalFarmers.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stats.totalFarmers.subtitle}</p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </motion.div>

            {/* Jobs Active */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Active Contracts</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.activeContracts.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stats.activeContracts.subtitle}</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </motion.div>

            {/* Jobs Due */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Marketplace Listings</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.marketplaceListings.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stats.marketplaceListings.subtitle}</p>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <ShoppingBag className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </motion.div>

            {/* Jobs Completed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Platform Revenue</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalRevenue.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stats.totalRevenue.subtitle}</p>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Map View */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="relative flex-1 mr-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Plus className="h-4 w-4" />
                  <span className="text-sm font-medium">New Job</span>
                </button>
                <div className="ml-2 flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <Sun className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-700">18°C</span>
                </div>
              </div>
              <div className="relative h-96 bg-gradient-to-br from-green-50 to-emerald-50">
                {/* Placeholder for map */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Interactive Farm Map</p>
                    <p className="text-sm text-gray-400 mt-2">Showing 14 fields across 54,862 hectares</p>
                    {/* Farm markers */}
                    <div className="mt-8 flex justify-center space-x-4">
                      <div className="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow-lg text-sm font-medium">
                        Bay Land
                      </div>
                      <div className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg text-sm font-medium">
                        YNS Farm
                      </div>
                      <div className="px-4 py-2 bg-red-500 text-white rounded-lg shadow-lg text-sm font-medium">
                        ARD Farm
                      </div>
                    </div>
                  </div>
                </div>
                {/* Map controls */}
                <div className="absolute left-4 top-4 bg-white rounded-lg shadow-md">
                  <button className="p-2 hover:bg-gray-50 border-b border-gray-100">
                    <Plus className="h-4 w-4 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-50">
                    <span className="text-gray-600 font-bold">−</span>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Crop Distribution */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Crop Distribution</h3>
                <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option>2022</option>
                  <option>2023</option>
                  <option>2024</option>
                </select>
              </div>
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="24"
                      strokeDasharray="251 503"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="24"
                      strokeDasharray="78 503"
                      strokeDashoffset="-251"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="24"
                      strokeDasharray="52 503"
                      strokeDashoffset="-329"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      fill="none"
                      stroke="#8b5cf6"
                      strokeWidth="24"
                      strokeDasharray="34 503"
                      strokeDashoffset="-381"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-3xl font-bold text-gray-800">54,862</p>
                    <p className="text-sm text-gray-500">Hectares</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {cropData.map((crop) => (
                  <div key={crop.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: crop.color }}></div>
                      <span className="text-sm font-medium text-gray-700">{crop.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">({crop.percentage}%)</p>
                      <p className="text-xs text-gray-500">{crop.value.toLocaleString()} Ha</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cost Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">Cost Analysis</h3>
                <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option>Monthly</option>
                  <option>Weekly</option>
                  <option>Yearly</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cost"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: "#10b981", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4 flex items-center justify-center">
                <div className="px-4 py-2 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">$386.50</p>
                </div>
              </div>
            </motion.div>

            {/* Recent Due Jobs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Recent Due Jobs</h3>
                <button className="text-sm text-green-600 hover:text-green-700 font-medium">See All</button>
              </div>
              <div className="space-y-3">
                {[
                  { title: "Harrowing Season", location: "ABY Farm - Bay Land" },
                  { title: "Harrowing Season", location: "YNS Farm - ARD Land" },
                ].map((job, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Clock className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800">{job.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{job.location}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Upgrade Banner */}
              <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 mb-1">Platform Health</p>
                    <p className="text-xs text-gray-600">All systems operational</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-700">Active</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          </>
          )}

          {/* Contracts View */}
          {selectedView === "contracts" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">All Contracts</h2>
                  <p className="text-gray-600 mt-1">Manage farming contracts and agreements</p>
                </div>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>New Contract</span>
                </button>
              </div>
              <div className="space-y-4">
                {[
                  { id: "C001", farmer: "John Mwale", crop: "Mangoes", amount: "K15,000", status: "active", date: "2024-11-01" },
                  { id: "C002", farmer: "Mary Banda", crop: "Tomatoes", amount: "K12,000", status: "active", date: "2024-11-03" },
                  { id: "C003", farmer: "Peter Phiri", crop: "Pineapples", amount: "K8,500", status: "pending", date: "2024-11-05" },
                  { id: "C004", farmer: "Sarah Phiri", crop: "Cashews", amount: "K10,000", status: "active", date: "2024-11-02" },
                ].map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-500 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <FileText className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{contract.id} - {contract.crop}</h3>
                        <p className="text-sm text-gray-600">{contract.farmer} • {contract.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-lg font-bold text-gray-900">{contract.amount}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        contract.status === "active" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                      }`}>
                        {contract.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Farmers View */}
          {selectedView === "farmers" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Farmers Directory</h2>
                  <p className="text-gray-600 mt-1">156 active farmers on platform</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search farmers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: "John Mwale", location: "Lusaka", crops: "Mangoes, Cashews", contracts: 5, verified: true },
                  { name: "Mary Banda", location: "Kabwe", crops: "Tomatoes, Peppers", contracts: 8, verified: true },
                  { name: "Peter Phiri", location: "Kitwe", crops: "Pineapples", contracts: 3, verified: true },
                  { name: "Sarah Phiri", location: "Ndola", crops: "Cashews, Mangoes", contracts: 6, verified: false },
                  { name: "James Mwamba", location: "Lusaka", crops: "Tomatoes", contracts: 4, verified: true },
                  { name: "Grace Banda", location: "Kabwe", crops: "Pineapples, Mangoes", contracts: 7, verified: true },
                ].map((farmer, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-green-500 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-green-700">{farmer.name.charAt(0)}</span>
                      </div>
                      {farmer.verified && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                    </div>
                    <h3 className="font-semibold text-gray-900">{farmer.name}</h3>
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {farmer.location}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">{farmer.crops}</p>
                    <p className="text-xs text-gray-500 mt-1">{farmer.contracts} contracts</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buyers View */}
          {selectedView === "buyers" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Buyers Directory</h2>
                  <p className="text-gray-600 mt-1">Active buyers and purchase history</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { name: "Fresh Foods Ltd", orders: 12, spent: "K45,000", location: "Lusaka", contact: "john@freshfoods.zm" },
                  { name: "Market Suppliers Co", orders: 8, spent: "K32,000", location: "Ndola", contact: "info@marketsuppliers.zm" },
                  { name: "Agro Exports", orders: 15, spent: "K68,000", location: "Kitwe", contact: "sales@agroexports.zm" },
                  { name: "Farm Fresh Zambia", orders: 6, spent: "K28,000", location: "Lusaka", contact: "orders@farmfresh.zm" },
                ].map((buyer, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-500 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{buyer.name}</h3>
                        <p className="text-sm text-gray-600">{buyer.location} • {buyer.orders} orders</p>
                        <p className="text-xs text-gray-500">{buyer.contact}</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{buyer.spent}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Officers View */}
          {selectedView === "officers" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Extension Officers</h2>
                  <p className="text-gray-600 mt-1">Verification officers and performance</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: "Officer James", verifications: 45, approved: 42, earnings: "K2,250", rating: 4.9 },
                  { name: "Officer Grace", verifications: 38, approved: 36, earnings: "K1,900", rating: 4.8 },
                  { name: "Officer David", verifications: 52, approved: 48, earnings: "K2,600", rating: 4.7 },
                  { name: "Officer Sarah", verifications: 41, approved: 39, earnings: "K2,050", rating: 4.9 },
                ].map((officer, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-green-500 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-blue-700">{officer.name.charAt(8)}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{officer.rating} ⭐</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{officer.name}</h3>
                    <p className="text-sm text-gray-600 mt-2">{officer.verifications} verifications</p>
                    <p className="text-sm text-gray-600">{officer.approved} approved</p>
                    <p className="text-sm font-semibold text-green-600 mt-2">{officer.earnings} earned</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics View */}
          {selectedView === "analytics" && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Analytics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                    <TrendingUp className="h-8 w-8 text-green-600 mb-3" />
                    <p className="text-sm text-gray-600">Growth Rate</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">+23%</p>
                    <p className="text-xs text-gray-500 mt-1">vs last month</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                    <Users className="h-8 w-8 text-blue-600 mb-3" />
                    <p className="text-sm text-gray-600">User Engagement</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">87%</p>
                    <p className="text-xs text-gray-500 mt-1">active users</p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                    <DollarSign className="h-8 w-8 text-purple-600 mb-3" />
                    <p className="text-sm text-gray-600">Revenue Growth</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">+31%</p>
                    <p className="text-xs text-gray-500 mt-1">this quarter</p>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={costData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip />
                      <Line type="monotone" dataKey="cost" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Payments View */}
          {selectedView === "payments" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Payment Transactions</h2>
                  <p className="text-gray-600 mt-1">Platform payment history and processing</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { id: "TXN001", from: "Fresh Foods Ltd", to: "John Mwale", amount: "K15,000", status: "completed", date: "2024-11-07", hash: "0x742d35..." },
                  { id: "TXN002", from: "Market Suppliers", to: "Mary Banda", amount: "K12,000", status: "completed", date: "2024-11-07", hash: "0x8ba1f1..." },
                  { id: "TXN003", from: "Agro Exports", to: "Peter Phiri", amount: "K8,500", status: "processing", date: "2024-11-07", hash: "0x9f2df0..." },
                  { id: "TXN004", from: "Farm Fresh", to: "Sarah Phiri", amount: "K10,000", status: "completed", date: "2024-11-06", hash: "0x3c8a2b..." },
                ].map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-500 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{payment.id}</h3>
                        <p className="text-sm text-gray-600">{payment.from} → {payment.to}</p>
                        <p className="text-xs text-gray-500">{payment.date} • {payment.hash}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-lg font-bold text-gray-900">{payment.amount}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        payment.status === "completed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings View */}
          {selectedView === "settings" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Settings</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">General Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-gray-700">Platform Name</span>
                      <span className="font-medium">Cherry Pick</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-gray-700">Currency</span>
                      <span className="font-medium">ZMW (Kwacha)</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-gray-700">Time Zone</span>
                      <span className="font-medium">Africa/Lusaka</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-gray-700">Language</span>
                      <span className="font-medium">English</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Verification Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-gray-700">Officer Fee per Verification</span>
                      <span className="font-medium">K50</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-gray-700">Auto-approve Verified Farmers</span>
                      <span className="font-medium text-green-600">Enabled</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-gray-700">Minimum Listing Quality</span>
                      <span className="font-medium">Grade B</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Payment Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-gray-700">Platform Fee</span>
                      <span className="font-medium">2.5%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-gray-700">Payment Network</span>
                      <span className="font-medium">Base (Coinbase L2)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
