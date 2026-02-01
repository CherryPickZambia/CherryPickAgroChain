import { supabase } from './supabase';

// ============================================
// SAMPLE DATA FALLBACK (when Supabase is unavailable)
// ============================================

const SAMPLE_LISTINGS: MarketplaceListing[] = [
  {
    id: 'sample-1',
    farmer_id: 'farmer-1',
    farmer_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f8E2B1',
    crop_type: 'Mangoes',
    quantity: 500,
    unit: 'kg',
    price_per_unit: 25,
    total_price: 12500,
    description: 'Fresh Kent mangoes from Lusaka province. Hand-picked at peak ripeness for the best flavor.',
    location: 'Lusaka',
    harvest_date: '2024-11-15',
    available_quantity: 450,
    status: 'active',
    quality_grade: 'Premium',
    organic: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sample-2',
    farmer_id: 'farmer-2',
    farmer_address: '0x8ba1F109551bD432803012645Ac136ddd64DBA72',
    crop_type: 'Tomatoes',
    quantity: 1000,
    unit: 'kg',
    price_per_unit: 15,
    total_price: 15000,
    description: 'Roma tomatoes, perfect for processing. Grown using sustainable farming practices.',
    location: 'Kabwe',
    harvest_date: '2024-11-10',
    available_quantity: 800,
    status: 'active',
    quality_grade: 'A',
    organic: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sample-3',
    farmer_id: 'farmer-3',
    farmer_address: '0x9f2dF0fed2C77648de5860a4dc508cd0572B6C1a',
    crop_type: 'Pineapples',
    quantity: 300,
    unit: 'kg',
    price_per_unit: 30,
    total_price: 9000,
    description: 'Sweet Sugarloaf pineapples. Naturally ripened and pesticide-free.',
    location: 'Mansa',
    harvest_date: '2024-11-08',
    available_quantity: 280,
    status: 'active',
    quality_grade: 'Premium',
    organic: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sample-4',
    farmer_id: 'farmer-4',
    farmer_address: '0x3c8a2b7e9F1dE6Ca4B5a3e7d9C1f2A8b4D6e5F7a',
    crop_type: 'Cashew nuts',
    quantity: 200,
    unit: 'kg',
    price_per_unit: 120,
    total_price: 24000,
    description: 'Premium raw cashew nuts. W320 grade, ready for export or processing.',
    location: 'Chipata',
    harvest_date: '2024-10-20',
    available_quantity: 180,
    status: 'active',
    quality_grade: 'Premium',
    organic: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sample-5',
    farmer_id: 'farmer-5',
    farmer_address: '0x5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e',
    crop_type: 'Bananas',
    quantity: 800,
    unit: 'kg',
    price_per_unit: 12,
    total_price: 9600,
    description: 'Fresh Cavendish bananas. Yellow and ready for retail.',
    location: 'Ndola',
    harvest_date: '2024-11-12',
    available_quantity: 750,
    status: 'active',
    quality_grade: 'A',
    organic: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sample-6',
    farmer_id: 'farmer-6',
    farmer_address: '0x6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f',
    crop_type: 'Beetroot',
    quantity: 400,
    unit: 'kg',
    price_per_unit: 18,
    total_price: 7200,
    description: 'Organic beetroot, perfect for juicing or salads. Rich in color and nutrients.',
    location: 'Livingstone',
    harvest_date: '2024-11-05',
    available_quantity: 350,
    status: 'active',
    quality_grade: 'A',
    organic: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SAMPLE_ORDERS: MarketplaceOrder[] = [];

// ============================================
// MARKETPLACE TYPES
// ============================================

export interface MarketplaceListing {
  id: string;
  farmer_id: string;
  farmer_address: string;
  crop_type: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  total_price: number;
  description?: string;
  image_url?: string;
  location?: string;
  harvest_date?: string;
  available_quantity: number;
  status: 'active' | 'sold' | 'cancelled' | 'pending';
  quality_grade?: 'A' | 'B' | 'C' | 'Premium';
  organic: boolean;
  batch_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceOrder {
  id: string;
  listing_id: string;
  buyer_address: string;
  buyer_name?: string;
  farmer_address: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  payment_tx_hash?: string;
  delivery_status: 'pending' | 'preparing' | 'in_transit' | 'delivered' | 'cancelled';
  delivery_address?: string;
  delivery_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BuyerProfile {
  id: string;
  wallet_address: string;
  name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  delivery_address?: string;
  city?: string;
  country: string;
  profile_image?: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Farmer {
  id: string;
  wallet_address: string;
  name: string;
  email?: string;
  phone?: string;
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  farm_size?: number;
  crops?: string[];
  certifications?: string[];
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Officer {
  id: string;
  wallet_address: string;
  name: string;
  email?: string;
  phone?: string;
  verification_count: number;
  approval_rate: number;
  total_earnings: number;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

// ============================================
// MARKETPLACE LISTINGS
// ============================================

export async function getMarketplaceListings(filters?: {
  crop_type?: string;
  status?: string;
  min_price?: number;
  max_price?: number;
}) {
  try {
    // Check if supabase is available
    if (!supabase) {
      console.log('Using sample marketplace data (Supabase not configured)');
      return filterSampleListings(SAMPLE_LISTINGS, filters);
    }

    let query = supabase
      .from('marketplace_listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.crop_type) {
      query = query.eq('crop_type', filters.crop_type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.min_price) {
      query = query.gte('price_per_unit', filters.min_price);
    }
    if (filters?.max_price) {
      query = query.lte('price_per_unit', filters.max_price);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error fetching listings:', error.message || error.code || JSON.stringify(error));
      console.log('Falling back to sample data due to database error');
      return filterSampleListings(SAMPLE_LISTINGS, filters);
    }

    // If no data returned, use sample data
    if (!data || data.length === 0) {
      console.log('No listings in database, using sample data');
      return filterSampleListings(SAMPLE_LISTINGS, filters);
    }

    return data as MarketplaceListing[];
  } catch (error: any) {
    console.error('Error fetching marketplace listings:', error?.message || error);
    console.log('Falling back to sample data');
    return filterSampleListings(SAMPLE_LISTINGS, filters);
  }
}

// Helper function to filter sample listings
function filterSampleListings(
  listings: MarketplaceListing[],
  filters?: {
    crop_type?: string;
    status?: string;
    min_price?: number;
    max_price?: number;
  }
): MarketplaceListing[] {
  let filtered = [...listings];

  if (filters?.crop_type) {
    filtered = filtered.filter(l => l.crop_type === filters.crop_type);
  }
  if (filters?.status) {
    filtered = filtered.filter(l => l.status === filters.status);
  }
  if (filters?.min_price) {
    filtered = filtered.filter(l => l.price_per_unit >= filters.min_price!);
  }
  if (filters?.max_price) {
    filtered = filtered.filter(l => l.price_per_unit <= filters.max_price!);
  }

  return filtered;
}

export async function createMarketplaceListing(listing: Omit<MarketplaceListing, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('marketplace_listings')
      .insert([listing])
      .select()
      .single();

    if (error) throw error;
    return data as MarketplaceListing;
  } catch (error) {
    console.error('Error creating marketplace listing:', error);
    throw error;
  }
}

export async function updateMarketplaceListing(id: string, updates: Partial<MarketplaceListing>) {
  try {
    const { data, error } = await supabase
      .from('marketplace_listings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as MarketplaceListing;
  } catch (error) {
    console.error('Error updating marketplace listing:', error);
    throw error;
  }
}

// ============================================
// MARKETPLACE ORDERS
// ============================================

export async function getMarketplaceOrders(buyerAddress?: string) {
  try {
    let query = supabase
      .from('marketplace_orders')
      .select('*, marketplace_listings(farmer_address)')
      .order('created_at', { ascending: false });

    if (buyerAddress) {
      query = query.eq('buyer_address', buyerAddress);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Map the result to include farmer_address from listing if missing in order
    return data.map((order: any) => ({
      ...order,
      farmer_address: order.farmer_address || order.marketplace_listings?.farmer_address
    })) as MarketplaceOrder[];
  } catch (error) {
    console.error('Error fetching marketplace orders:', error);
    return [];
  }
}

export async function createMarketplaceOrder(order: Omit<MarketplaceOrder, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('marketplace_orders')
      .insert([order])
      .select()
      .single();

    if (error) throw error;

    // Update listing available quantity
    if (data) {
      await supabase.rpc('update_listing_quantity', {
        listing_id: order.listing_id,
        quantity_sold: order.quantity
      });
    }

    return data as MarketplaceOrder;
  } catch (error) {
    console.error('Error creating marketplace order:', error);
    throw error;
  }
}

export async function updateMarketplaceOrder(id: string, updates: Partial<MarketplaceOrder>) {
  try {
    const { data, error } = await supabase
      .from('marketplace_orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as MarketplaceOrder;
  } catch (error) {
    console.error('Error updating marketplace order:', error);
    throw error;
  }
}

// ============================================
// BUYER PROFILES
// ============================================

export async function getBuyerProfile(walletAddress: string) {
  try {
    const { data, error } = await supabase
      .from('buyer_profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
    return data as BuyerProfile | null;
  } catch (error) {
    console.error('Error fetching buyer profile:', error);
    return null;
  }
}

export async function createOrUpdateBuyerProfile(profile: Omit<BuyerProfile, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('buyer_profiles')
      .upsert([profile], { onConflict: 'wallet_address' })
      .select()
      .single();

    if (error) throw error;
    return data as BuyerProfile;
  } catch (error) {
    console.error('Error creating/updating buyer profile:', error);
    throw error;
  }
}

// ============================================
// FARMER PROFILES
// ============================================

export async function getFarmerProfile(walletAddress: string) {
  try {
    const { data, error } = await supabase
      .from('farmers')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as Farmer | null;
  } catch (error) {
    console.error('Error fetching farmer profile:', error);
    return null;
  }
}

export async function createOrUpdateFarmerProfile(profile: Omit<Farmer, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('farmers')
      .upsert([profile], { onConflict: 'wallet_address' })
      .select()
      .single();

    if (error) throw error;
    return data as Farmer;
  } catch (error) {
    console.error('Error creating/updating farmer profile:', error);
    throw error;
  }
}

export async function getFarmerListings(farmerId: string) {
  try {
    const { data, error } = await supabase
      .from('marketplace_listings')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as MarketplaceListing[];
  } catch (error) {
    console.error('Error fetching farmer listings:', error);
    return [];
  }
}

// ============================================
// ANALYTICS & INSIGHTS
// ============================================

export async function getMarketplaceAnalytics() {
  try {
    const [listings, orders] = await Promise.all([
      supabase.from('marketplace_listings').select('*'),
      supabase.from('marketplace_orders').select('*')
    ]);

    const totalListings = listings.data?.length || 0;
    const activeListings = listings.data?.filter((l: MarketplaceListing) => l.status === 'active').length || 0;
    const totalOrders = orders.data?.length || 0;
    const completedOrders = orders.data?.filter((o: MarketplaceOrder) => o.payment_status === 'completed').length || 0;
    const totalRevenue = orders.data?.reduce((sum: number, o: MarketplaceOrder) => sum + (o.total_amount || 0), 0) || 0;

    return {
      totalListings,
      activeListings,
      totalOrders,
      completedOrders,
      totalRevenue,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
    };
  } catch (error) {
    console.error('Error fetching marketplace analytics:', error);
    return {
      totalListings: 0,
      activeListings: 0,
      totalOrders: 0,
      completedOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0
    };
  }
}

export async function getCropPriceAnalytics(cropType?: string) {
  try {
    let query = supabase
      .from('marketplace_listings')
      .select('crop_type, price_per_unit, created_at');

    if (cropType) {
      query = query.eq('crop_type', cropType);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by crop type and calculate average prices
    const pricesByType = (data || []).reduce((acc: any, listing: any) => {
      if (!acc[listing.crop_type]) {
        acc[listing.crop_type] = {
          prices: [],
          count: 0,
          total: 0
        };
      }
      acc[listing.crop_type].prices.push(listing.price_per_unit);
      acc[listing.crop_type].count++;
      acc[listing.crop_type].total += listing.price_per_unit;
      return acc;
    }, {});

    return Object.entries(pricesByType).map(([crop, stats]: [string, any]) => ({
      crop,
      averagePrice: stats.total / stats.count,
      minPrice: Math.min(...stats.prices),
      maxPrice: Math.max(...stats.prices),
      listingCount: stats.count
    }));
  } catch (error) {
    console.error('Error fetching crop price analytics:', error);
    return [];
  }
}
