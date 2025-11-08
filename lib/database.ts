import { supabase } from './supabase';

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

    if (error) throw error;
    return data as MarketplaceListing[];
  } catch (error) {
    console.error('Error fetching marketplace listings:', error);
    return [];
  }
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
      .select('*')
      .order('created_at', { ascending: false });

    if (buyerAddress) {
      query = query.eq('buyer_address', buyerAddress);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as MarketplaceOrder[];
  } catch (error) {
    console.error('Error fetching marketplace orders:', error);
    return [];
  }
}

export async function createMarketplaceOrder(order: Omit<MarketplaceOrder, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error} = await supabase
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

export async function getFarmerListings(farmerAddress: string) {
  try {
    const { data, error } = await supabase
      .from('marketplace_listings')
      .select('*')
      .eq('farmer_address', farmerAddress)
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
    const activeListings = listings.data?.filter(l => l.status === 'active').length || 0;
    const totalOrders = orders.data?.length || 0;
    const completedOrders = orders.data?.filter(o => o.payment_status === 'completed').length || 0;
    const totalRevenue = orders.data?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

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
