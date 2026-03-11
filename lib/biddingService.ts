"use client";

// Bidding & Supply Demand Service
// Handles supply demand postings and farmer bid submissions

import { supabase, type Farmer, type Contract } from './supabase';
import { createBatchForContract } from './traceabilityService';

function checkSupabase() {
    if (!supabase) {
        throw new Error('Supabase is not configured.');
    }
    return supabase;
}

function isMissingColumnError(error: unknown, columnName: string): boolean {
    if (!error || typeof error !== 'object') return false;
    const message = 'message' in error ? String(error.message || '') : '';
    const details = 'details' in error ? String(error.details || '') : '';
    const hint = 'hint' in error ? String(error.hint || '') : '';

    return [message, details, hint].some((value) =>
        value.toLowerCase().includes(columnName.toLowerCase())
    );
}

async function insertFarmerBidWithFallback(client: ReturnType<typeof checkSupabase>, bid: Omit<FarmerBid, 'id' | 'created_at' | 'updated_at'>) {
    const primaryPayload = {
        supply_demand_id: bid.supply_demand_id,
        farmer_id: bid.farmer_id,
        proposed_quantity: bid.proposed_quantity,
        proposed_price_per_unit: bid.proposed_price_per_unit,
        offered_quantity: bid.proposed_quantity,
        offered_price_per_kg: bid.proposed_price_per_unit,
        delivery_date: bid.delivery_date,
        notes: bid.notes,
        status: bid.status,
    };

    const primaryResult = await client
        .from('farmer_bids')
        .insert(primaryPayload)
        .select()
        .single();

    if (!primaryResult.error) {
        return primaryResult;
    }

    if (!isMissingColumnError(primaryResult.error, 'supply_demand_id')) {
        return primaryResult;
    }

    return client
        .from('farmer_bids')
        .insert({
            demand_id: bid.supply_demand_id,
            farmer_id: bid.farmer_id,
            proposed_quantity: bid.proposed_quantity,
            proposed_price_per_unit: bid.proposed_price_per_unit,
            offered_quantity: bid.proposed_quantity,
            offered_price_per_kg: bid.proposed_price_per_unit,
            delivery_date: bid.delivery_date,
            notes: bid.notes,
            status: bid.status,
        })
        .select()
        .single();
}

async function getBidsByFarmerWithFallback(client: ReturnType<typeof checkSupabase>, farmerId: string) {
    const primaryResult = await client
        .from('farmer_bids')
        .select(`
      *,
      supply_demand:supply_demands!farmer_bids_supply_demand_id_fkey(title, crop_type, required_quantity, unit, max_price_per_unit, delivery_deadline, status)
    `)
        .eq('farmer_id', farmerId)
        .order('created_at', { ascending: false });

    if (!primaryResult.error) {
        return primaryResult;
    }

    if (!isMissingColumnError(primaryResult.error, 'supply_demand_id') && !isMissingColumnError(primaryResult.error, 'farmer_bids_supply_demand_id_fkey')) {
        return primaryResult;
    }

    return client
        .from('farmer_bids')
        .select(`
      *,
      supply_demand:supply_demands!farmer_bids_demand_id_fkey(title, crop_type, required_quantity, unit, max_price_per_unit, delivery_deadline, status)
    `)
        .eq('farmer_id', farmerId)
        .order('created_at', { ascending: false });
}

async function getBidsByDemandWithFallback(client: ReturnType<typeof checkSupabase>, demandId: string) {
    const primaryResult = await client
        .from('farmer_bids')
        .select(`
      *,
      farmer:farmers(id, name, wallet_address, location_address, farm_size, status)
    `)
        .eq('supply_demand_id', demandId)
        .order('proposed_price_per_unit', { ascending: true });

    if (!primaryResult.error) {
        return primaryResult;
    }

    if (!isMissingColumnError(primaryResult.error, 'supply_demand_id')) {
        return primaryResult;
    }

    return client
        .from('farmer_bids')
        .select(`
      *,
      farmer:farmers(id, name, wallet_address, location_address, farm_size, status)
    `)
        .eq('demand_id', demandId)
        .order('proposed_price_per_unit', { ascending: true });
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
    // Fetching all to handle potential status casing issues or slight schema variations
    const { data, error } = await client
        .from('supply_demands')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        // Gracefully handle missing table or permission errors
        const msg = error.message || error.code || '';
        if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('42P01') || msg.includes('permission denied')) {
            console.warn('Bidding Service: supply_demands table not available:', msg);
            return [];
        }
        console.error('Error fetching open supply demands:', error);
        throw error;
    }

    // Filter for open/active demands in JS for maximum robustness
    const openStatuses = ['open', 'partially_filled', 'active'];
    const filtered = (data || []).filter((demand: SupplyDemand) =>
        demand.status && openStatuses.includes(demand.status.toLowerCase())
    );

    console.log(`Bidding Service: Found ${data?.length || 0} total demands, ${filtered.length} are open/active.`);
    return filtered;
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
    const { data, error } = await insertFarmerBidWithFallback(client, bid);

    if (error) throw error;
    return data;
}

export async function getBidsByFarmer(farmerId: string): Promise<FarmerBid[]> {
    const client = checkSupabase();

    // Prevent 22P02 invalid input syntax for type uuid error
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(farmerId)) {
        console.warn(`[getBidsByFarmer] Invalid UUID provided: ${farmerId}. Returning empty array to prevent database error.`);
        return [];
    }

    const { data, error } = await getBidsByFarmerWithFallback(client, farmerId);

    if (error) {
        const msg = error.message || error.code || '';
        if (msg.includes('does not exist') || msg.includes('relation') || msg.includes('42P01') || msg.includes('permission denied')) {
            console.warn('Bidding Service: farmer_bids table not available:', msg);
            return [];
        }
        throw error;
    }
    return data || [];
}

export async function getBidsByDemand(demandId: string): Promise<(FarmerBid & { farmer?: Farmer })[]> {
    const client = checkSupabase();

    // Prevent 22P02 invalid input syntax for type uuid error
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(demandId)) {
        console.warn(`[getBidsByDemand] Invalid UUID provided: ${demandId}. Returning empty array to prevent database error.`);
        return [];
    }

    const { data, error } = await getBidsByDemandWithFallback(client, demandId);

    if (error) throw error;
    return data || [];
}

export async function updateBidStatus(
    bidId: string,
    status: FarmerBid['status'],
    adminNotes?: string
): Promise<void> {
    const client = checkSupabase();
    const updateData: Partial<FarmerBid> = {
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
): Promise<Contract> {
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

    // --- NEW: Create Traceability Batch ---
    try {
        const batch = await createBatchForContract(
            contract.id,
            farmerId,
            cropType,
            undefined, // variety
            quantity,
            'kg' // default unit
        );
        console.log('Traceability batch created for contract:', contract.id);

        // --- NEW: Log Initial Event ---
        const { addTraceabilityEvent } = await import('./traceabilityService');
        await addTraceabilityEvent({
            batch_id: batch.id!,
            event_type: 'verification',
            event_title: 'Contract Created & Batch Initialized',
            event_description: `Contract ${contractCode} signed for ${quantity}kg of ${cropType}. Initial traceability batch started.`,
            actor_name: 'System/Admin',
            actor_type: 'admin',
        });
    } catch (batchError) {
        console.error('Failed to create traceability batch or log initial event:', batchError);
    }

    return contract;
}
