"use client";

import { useState } from "react";
import { User, BookOpen, Leaf, Heart, ShoppingCart, Star, MapPin, QrCode } from "lucide-react";

interface Product {
  id: string;
  name: string;
  farmer: {
    name: string;
    photo: string;
    location: string;
    story: string;
  };
  image: string;
  price: number;
  unit: string;
  sustainabilityScore: number;
  nutrition: {
    calories: number;
    protein: string;
    vitamins: string[];
  };
  recipes: string[];
  available: boolean;
}

export default function ConsumerPortal() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'farmers' | 'recipes'>('products');

  // Sample data
  const products: Product[] = [
    {
      id: '1',
      name: 'Organic Mangoes (Kent)',
      farmer: {
        name: 'John Mwale',
        photo: '/farmers/john.jpg',
        location: 'Lusaka, Zambia',
        story: 'Growing mangoes for 15 years using sustainable practices. My farm is certified organic and I use natural pest control methods.',
      },
      image: '/products/mangoes.jpg',
      price: 25,
      unit: 'kg',
      sustainabilityScore: 95,
      nutrition: {
        calories: 60,
        protein: '0.8g',
        vitamins: ['Vitamin C', 'Vitamin A', 'Folate'],
      },
      recipes: ['Mango Smoothie', 'Mango Salsa', 'Grilled Mango'],
      available: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-[#7fb069] to-[#2d5f3f] p-2.5 rounded-xl">
                <Leaf className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#1a1a1a]">AgroChain 360</h1>
                <p className="text-xs text-gray-600">Farm to Table Marketplace</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <User className="h-6 w-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {[
              { id: 'products', label: 'Products', icon: ShoppingCart },
              { id: 'farmers', label: 'Meet Farmers', icon: User },
              { id: 'recipes', label: 'Recipes', icon: BookOpen },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#2d5f3f] text-[#2d5f3f]'
                      : 'border-transparent text-gray-600 hover:text-[#2d5f3f]'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'products' && (
          <div className="grid md:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="card-premium hover:shadow-2xl transition-all group">
                {/* Product Image */}
                <div className="relative h-48 bg-gradient-to-br from-[#f0f7f4] to-[#e8f5e9] rounded-xl mb-4 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Leaf className="h-24 w-24 text-[#2d5f3f]/20" />
                  </div>
                  {/* Sustainability Badge */}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                    <Leaf className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-bold text-green-600">{product.sustainabilityScore}%</span>
                  </div>
                </div>

                {/* Product Info */}
                <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">{product.name}</h3>
                
                {/* Farmer Info */}
                <div className="flex items-center gap-3 mb-4 p-3 bg-[#f0f7f4] rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7fb069] to-[#2d5f3f] flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1a1a1a]">{product.farmer.name}</p>
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {product.farmer.location}
                    </p>
                  </div>
                </div>

                {/* Nutrition Highlights */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-semibold text-gray-700">Nutrition</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.nutrition.vitamins.map((vitamin) => (
                      <span key={vitamin} className="badge badge-success text-xs">
                        {vitamin}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price & CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-2xl font-bold text-[#2d5f3f]">
                      K{product.price}
                      <span className="text-sm text-gray-600 font-normal">/{product.unit}</span>
                    </p>
                  </div>
                  <button className="btn-primary flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Buy Now
                  </button>
                </div>

                {/* View Details */}
                <button
                  onClick={() => setSelectedProduct(product)}
                  className="w-full mt-3 text-sm text-[#2d5f3f] font-medium hover:underline"
                >
                  View Full Details →
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'farmers' && (
          <div className="grid md:grid-cols-2 gap-6">
            {products.map((product) => (
              <div key={product.id} className="card-premium">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7fb069] to-[#2d5f3f] flex items-center justify-center">
                    <User className="h-10 w-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-[#1a1a1a] mb-1">{product.farmer.name}</h3>
                    <p className="text-gray-600 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {product.farmer.location}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-sm text-gray-600 ml-2">(4.9)</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-[#1a1a1a] mb-2">Farmer's Story</h4>
                  <p className="text-gray-600 leading-relaxed">{product.farmer.story}</p>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 btn-primary">View Products</button>
                  <button className="px-4 py-2 border-2 border-[#2d5f3f] text-[#2d5f3f] rounded-lg font-semibold hover:bg-[#f0f7f4] transition-colors">
                    <QrCode className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'recipes' && (
          <div className="grid md:grid-cols-3 gap-6">
            {['Mango Smoothie', 'Mango Salsa', 'Grilled Mango', 'Mango Chutney', 'Mango Lassi', 'Mango Salad'].map((recipe) => (
              <div key={recipe} className="card-premium hover:shadow-2xl transition-all">
                <div className="h-40 bg-gradient-to-br from-[#f0f7f4] to-[#e8f5e9] rounded-xl mb-4 flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-[#2d5f3f]/30" />
                </div>
                <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">{recipe}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Delicious and healthy recipe using fresh organic mangoes
                </p>
                <button className="w-full btn-secondary">View Recipe</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl font-bold text-[#1a1a1a]">{selectedProduct.name}</h2>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div>
                  <div className="h-64 bg-gradient-to-br from-[#f0f7f4] to-[#e8f5e9] rounded-xl mb-6 flex items-center justify-center">
                    <Leaf className="h-32 w-32 text-[#2d5f3f]/20" />
                  </div>

                  <div className="card-premium">
                    <h3 className="font-bold text-[#1a1a1a] mb-3 flex items-center gap-2">
                      <Leaf className="h-5 w-5 text-green-600" />
                      Sustainability Score
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full"
                          style={{ width: `${selectedProduct.sustainabilityScore}%` }}
                        ></div>
                      </div>
                      <span className="text-2xl font-bold text-green-600">
                        {selectedProduct.sustainabilityScore}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Organic farming • Low carbon footprint • Water efficient
                    </p>
                  </div>
                </div>

                {/* Right Column */}
                <div>
                  <div className="card-premium mb-4">
                    <h3 className="font-bold text-[#1a1a1a] mb-3 flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500" />
                      Nutrition Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Calories (per 100g)</span>
                        <span className="font-semibold">{selectedProduct.nutrition.calories}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Protein</span>
                        <span className="font-semibold">{selectedProduct.nutrition.protein}</span>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Rich in:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.nutrition.vitamins.map((vitamin) => (
                            <span key={vitamin} className="badge badge-success">
                              {vitamin}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card-premium">
                    <h3 className="font-bold text-[#1a1a1a] mb-3 flex items-center gap-2">
                      <User className="h-5 w-5 text-[#2d5f3f]" />
                      Meet Your Farmer
                    </h3>
                    <p className="text-gray-600 mb-3">{selectedProduct.farmer.story}</p>
                    <button className="btn-secondary w-full">View Farmer Profile</button>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-[#2d5f3f]">
                    K{selectedProduct.price}
                    <span className="text-lg text-gray-600 font-normal">/{selectedProduct.unit}</span>
                  </p>
                </div>
                <button className="btn-primary flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
