"use client";

// Bidding & Supply Demand Service
// Handles supply demand postings and farmer bid submissions

import { supabase } from './supabase';

function checkSupabase() {
    if (!supabase) {
        throw new Error('Supabase is not configured.');
    }
    return supabase;
}

// ==================== SUPPLY DEMANDS ====================

export interface SupplyDemand {
    id?: string;
    title: string;
    crop_type: string;
    variety?: string;
    required_quantity: number;
    unit: string;
    max_price_per_unit: number;
    delivery_deadline: string;
    quality_requirements?: string;
    description?: string;
    status: 'open' | 'partially_filled' | 'filled' | 'closed';
    created_by?: string;
    created_at?: string;
    updated_at?: string;
}

export async function createSupplyDemand(demand: Omit<SupplyDemand, 'id' | 'created_at' | 'updated_at'>): Promise<SupplyDemand> {
    const client = checkSupabase();
    const { data, error } = await client
        .from('supply_demands')
        .insert(demand)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getOpenSupplyDemands(): Promise<SupplyDemand[]> {
    const client = checkSupabase();
    const { data, error } = await client
        .from('supply_demands')
        .select('*')
        .in('status', ['open', 'partially_filled'])
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getAllSupplyDemands(): Promise<SupplyDemand[]> {
    const client = checkSupabase();
    const { data, error } = await client
        .from('supply_demands')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function updateSupplyDemandStatus(id: string, status: SupplyDemand['status']): Promise<void> {
    const client = checkSupabase();
    const { error } = await client
        .from('supply_demands')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
}

// ==================== FARMER BIDS ====================

export interface FarmerBid {
    id?: string;
    supply_demand_id: string;
    farmer_id: string;
    proposed_quantity: number;
    proposed_price_per_unit: number;
    delivery_date?: string;
    notes?: string;
    status: 'submitted' | 'accepted' | 'rejected' | 'withdrawn';
    admin_notes?: string;
    created_at?: string;
    updated_at?: string;
}

export async function submitBid(bid: Omit<FarmerBid, 'id' | 'created_at' | 'updated_at'>): Promise<FarmerBid> {
    const client = checkSupabase();
    const { data, error } = await client
        .from('farmer_bids')
        .insert(bid)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getBidsByFarmer(farmerId: string): Promise<FarmerBid[]> {
    const client = checkSupabase();
    const { data, error } = await client
        .from('farmer_bids')
        .select(`
      *,
      supply_demand:supply_demands(title, crop_type, required_quantity, unit, max_price_per_unit, delivery_deadline, status)
    `)
        .eq('farmer_id', farmerId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getBidsByDemand(demandId: string): Promise<(FarmerBid & { farmer?: any })[]> {
    const client = checkSupabase();
    const { data, error } = await client
        .from('farmer_bids')
        .select(`
      *,
      farmer:farmers(id, name, wallet_address, location_address, farm_size, status)
    `)
        .eq('supply_demand_id', demandId)
        .order('proposed_price_per_unit', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function updateBidStatus(
    bidId: string,
    status: FarmerBid['status'],
    adminNotes?: string
): Promise<void> {
    const client = checkSupabase();
    const updateData: Record<string, any> = {
        status,
        updated_at: new Date().toISOString(),
    };
    if (adminNotes) updateData.admin_notes = adminNotes;

    const { error } = await client
        .from('farmer_bids')
        .update(updateData)
        .eq('id', bidId);

    if (error) throw error;
}

export async function acceptBidAndCreateContract(
    bidId: string,
    demandId: string,
    farmerId: string,
    cropType: string,
    quantity: number,
    pricePerUnit: number
): Promise<any> {
    const client = checkSupabase();

    // Accept the bid
    await updateBidStatus(bidId, 'accepted');

    // Reject other bids for same demand (optional, admin may accept multiple)
    // Not auto-rejecting — admin manages this.

    // Create draft contract
    const contractCode = `BID-${Date.now().toString(36).toUpperCase()}`;
    const { data: contract, error } = await client
        .from('contracts')
        .insert({
            contract_code: contractCode,
            farmer_id: farmerId,
            crop_type: cropType,
            required_quantity: quantity,
            price_per_kg: pricePerUnit,
            total_value: quantity * pricePerUnit,
            status: 'draft',
        })
        .select()
        .single();

    if (error) throw error;
    return contract;
}
