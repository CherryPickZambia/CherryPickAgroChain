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
        source_type: bid.source_type,
        traceability_mode: bid.traceability_mode,
        linked_batch_id: bid.linked_batch_id,
        traceability_details: bid.traceability_details || {},
        evidence_photo_urls: bid.evidence_photo_urls || [],
        ai_scan_result: bid.ai_scan_result,
        traceability_strength: bid.traceability_strength,
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
            source_type: bid.source_type,
            traceability_mode: bid.traceability_mode,
            linked_batch_id: bid.linked_batch_id,
            traceability_details: bid.traceability_details || {},
            evidence_photo_urls: bid.evidence_photo_urls || [],
            ai_scan_result: bid.ai_scan_result,
            traceability_strength: bid.traceability_strength,
        })
        .select()
        .single();
}

async function attachLinkedBatches<T extends FarmerBid>(
    client: ReturnType<typeof checkSupabase>,
    bids: T[]
): Promise<(T & { linked_batch?: LinkedBatchSummary })[]> {
    const batchIds = [...new Set(bids.map((bid) => bid.linked_batch_id).filter(Boolean))] as string[];
    if (batchIds.length === 0) return bids;

    const { data, error } = await client
        .from('batches')
        .select('id, batch_code, crop_type, variety, current_status, public_url, created_at')
        .in('id', batchIds);

    if (error) {
        console.warn('Could not load linked bid batches:', error.message);
        return bids;
    }

    const byId = new Map(
        ((data || []) as LinkedBatchSummary[]).map((batch) => [batch.id, batch])
    );
    return bids.map((bid) => ({
        ...bid,
        linked_batch: bid.linked_batch_id ? byId.get(bid.linked_batch_id) : undefined,
    }));
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

export type BidSourceType = 'own_produce' | 'third_party' | 'open_market';
export type BidTraceabilityMode = 'existing_batch' | 'intake_details' | 'basic_declaration';
export type BidTraceabilityStrength = 'high' | 'medium' | 'basic';

export interface BidTraceabilityDetails {
    harvest_date?: string;
    expected_harvest_start?: string;
    expected_harvest_end?: string;
    variety?: string;
    source_block_or_location?: string;
    production_notes?: string;
    supplier_name?: string;
    supplier_phone_or_id?: string;
    claimed_origin?: string;
    seller_name?: string;
    seller_contact?: string;
    market_name_or_location?: string;
    source_notes?: string;
}

export interface BidAIScanResult {
    healthScore: number;
    diagnosis: string;
    identifiedIssues: string[];
    recommendations: string[];
    confidenceScore: number;
    cropType?: string;
    growthStage?: string;
}

export interface LinkedBatchSummary {
    id: string;
    batch_code: string;
    crop_type: string;
    variety?: string;
    current_status?: string;
    public_url?: string;
    created_at?: string;
}

export function getBidTraceabilityStrength(
    mode?: BidTraceabilityMode,
    linkedBatchId?: string
): BidTraceabilityStrength {
    if (mode === 'existing_batch' && linkedBatchId) return 'high';
    if (mode === 'intake_details') return 'medium';
    return 'basic';
}

export interface FarmerBid {
    id?: string;
    supply_demand_id: string;
    farmer_id: string;
    proposed_quantity: number;
    proposed_price_per_unit: number;
    delivery_date?: string;
    notes?: string;
    source_type?: BidSourceType;
    traceability_mode?: BidTraceabilityMode;
    linked_batch_id?: string;
    traceability_details?: BidTraceabilityDetails;
    evidence_photo_urls?: string[];
    ai_scan_result?: BidAIScanResult;
    traceability_strength?: BidTraceabilityStrength;
    status: 'submitted' | 'accepted' | 'rejected' | 'withdrawn';
    admin_notes?: string;
    created_at?: string;
    updated_at?: string;
}

export async function submitBid(bid: Omit<FarmerBid, 'id' | 'created_at' | 'updated_at'>): Promise<FarmerBid> {
    const client = checkSupabase();

    if (!bid.source_type || !bid.traceability_mode) {
        throw new Error('Source type and traceability mode are required for every new bid.');
    }

    if (bid.traceability_mode === 'existing_batch') {
        if (bid.source_type !== 'own_produce' || !bid.linked_batch_id) {
            throw new Error('Only your own produce can link an existing tracked batch.');
        }

        const [{ data: batch }, { data: demand }] = await Promise.all([
            client
                .from('batches')
                .select('farmer_id, crop_type, contract_id')
                .eq('id', bid.linked_batch_id)
                .single(),
            client
                .from('supply_demands')
                .select('crop_type')
                .eq('id', bid.supply_demand_id)
                .single(),
        ]);

        if (!batch || batch.farmer_id !== bid.farmer_id || batch.contract_id) {
            throw new Error('The selected batch is unavailable or does not belong to this farmer.');
        }
        if (demand && batch.crop_type.trim().toLowerCase() !== demand.crop_type.trim().toLowerCase()) {
            throw new Error('The selected batch crop does not match this supply demand.');
        }
    }

    const { data, error } = await insertFarmerBidWithFallback(client, bid);

    if (error) {
        if (
            isMissingColumnError(error, 'source_type')
            || isMissingColumnError(error, 'traceability_mode')
            || isMissingColumnError(error, 'traceability_details')
        ) {
            throw new Error('Bid traceability is not installed in Supabase. Run add_bid_traceability_fields.sql first.');
        }
        throw error;
    }
    return data;
}

export async function getBidsByFarmer(farmerId: string): Promise<(FarmerBid & { linked_batch?: LinkedBatchSummary })[]> {
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
    return attachLinkedBatches(client, (data || []) as FarmerBid[]);
}

export async function getBidsByDemand(demandId: string): Promise<(FarmerBid & { farmer?: Farmer; linked_batch?: LinkedBatchSummary })[]> {
    const client = checkSupabase();

    // Prevent 22P02 invalid input syntax for type uuid error
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(demandId)) {
        console.warn(`[getBidsByDemand] Invalid UUID provided: ${demandId}. Returning empty array to prevent database error.`);
        return [];
    }

    const { data, error } = await getBidsByDemandWithFallback(client, demandId);

    if (error) throw error;
    return attachLinkedBatches(client, (data || []) as (FarmerBid & { farmer?: Farmer })[]);
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

export interface AcceptBidParams {
    bidId: string;
    demandId: string;
    farmerId: string;
    cropType: string;
    quantity: number;
    pricePerUnit: number;
    unit?: string;
    variety?: string;
    linkedBatchId?: string;
    traceabilityStrength?: BidTraceabilityStrength;
    sourceType?: BidSourceType;
    evidencePhotoUrls?: string[];
    aiScanResult?: BidAIScanResult;
    /** Delivery deadline (ISO/date string). Used as the delivery milestone due date. */
    deliveryDeadline?: string;
    /** Total quantity the buyer needs, used to mark the demand filled vs partially filled. */
    requiredQuantity?: number;
}

/**
 * Accept a farmer bid and stand up the fulfilment contract.
 *
 * Creates an active contract plus a single "Delivery" milestone worth 100% of
 * the contract value. The farmer logs the delivery, an officer verifies it and
 * the admin approves it - at which point payment is released (payment-on-delivery)
 * and the batch moves into the factory-processing queue for the rest of the
 * traceability chain (sorting → packaging → distribution).
 */
export async function acceptBidAndCreateContract(params: AcceptBidParams): Promise<Contract> {
    const {
        bidId,
        demandId,
        farmerId,
        cropType,
        quantity,
        pricePerUnit,
        unit = 'kg',
        variety,
        linkedBatchId,
        traceabilityStrength = getBidTraceabilityStrength(
            linkedBatchId ? 'existing_batch' : undefined,
            linkedBatchId
        ),
        sourceType,
        evidencePhotoUrls = [],
        aiScanResult,
        deliveryDeadline,
        requiredQuantity,
    } = params;

    const client = checkSupabase();

    if (linkedBatchId) {
        const { data: eligibleBatch, error: batchEligibilityError } = await client
            .from('batches')
            .select('id')
            .eq('id', linkedBatchId)
            .eq('farmer_id', farmerId)
            .is('contract_id', null)
            .single();

        if (batchEligibilityError || !eligibleBatch) {
            throw new Error('This tracked batch is no longer available or does not belong to the bidder.');
        }
    }

    // Accept the bid
    await updateBidStatus(bidId, 'accepted');

    const totalValue = quantity * pricePerUnit;
    const contractCode = `BID-${Date.now().toString(36).toUpperCase()}`;
    const deliveryDate =
        deliveryDeadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    // Create the active fulfilment contract
    const { data: contract, error } = await client
        .from('contracts')
        .insert({
            contract_code: contractCode,
            farmer_id: farmerId,
            crop_type: cropType,
            variety,
            required_quantity: quantity,
            quantity_unit: unit,
            price_per_kg: pricePerUnit,
            total_value: totalValue,
            status: 'active',
            harvest_date: deliveryDate,
        })
        .select()
        .single();

    if (error) throw error;

 // Delivery milestone: 100% payment released on verified delivery
    try {
        const { error: milestoneError } = await client
            .from('milestones')
            .insert({
                contract_id: contract.id,
                milestone_number: 1,
                name: 'Delivery',
                description: `Deliver ${quantity} ${unit} of ${cropType} to the buyer/warehouse as per the accepted bid. Payment of K${totalValue.toLocaleString()} is released once delivery is verified.`,
                payment_percentage: 100,
                payment_amount: totalValue,
                expected_date: deliveryDate,
                completed_date: null,
                status: 'pending',
                payment_status: 'pending',
                metadata: {
                    is_delivery: true,
                    source: 'bid',
                    bid_id: bidId,
                    demand_id: demandId,
                    source_type: sourceType,
                    traceability_strength: traceabilityStrength,
                    linked_batch_id: linkedBatchId,
                },
            });
        if (milestoneError) {
            console.error('Failed to create delivery milestone:', milestoneError);
        }
    } catch (msErr) {
        console.error('Error creating delivery milestone:', msErr);
    }

 // Create Traceability Batch + initial event
    try {
        let batch;
        if (linkedBatchId) {
            const { data: linkedBatch, error: linkedBatchError } = await client
                .from('batches')
                .update({
                    contract_id: contract.id,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', linkedBatchId)
                .eq('farmer_id', farmerId)
                .is('contract_id', null)
                .select()
                .single();

            if (linkedBatchError || !linkedBatch) {
                throw linkedBatchError || new Error('The linked batch could not be attached to this contract.');
            }
            batch = linkedBatch;
            console.log('Existing traceability batch linked to contract:', contract.id);
        } else {
            batch = await createBatchForContract(
                contract.id,
                farmerId,
                cropType,
                variety,
                quantity,
                unit
            );
            console.log('Traceability batch created for contract:', contract.id);
        }

        const { addTraceabilityEvent } = await import('./traceabilityService');
        await addTraceabilityEvent({
            batch_id: batch.id!,
            event_type: 'verification',
            event_title: 'Bid Accepted - Contract & Delivery Milestone Created',
            event_description: [
                `Bid accepted for ${quantity} ${unit} of ${cropType} at K${pricePerUnit}/${unit} (total K${totalValue.toLocaleString()}).`,
                `Source: ${sourceType || 'not recorded'}.`,
                `Traceability strength: ${traceabilityStrength}.`,
                aiScanResult
                    ? `Bid-stage AI scan: ${aiScanResult.healthScore}% health, ${aiScanResult.confidenceScore}% confidence — ${aiScanResult.diagnosis}.`
                    : null,
                'Awaiting delivery.',
            ].filter(Boolean).join(' '),
            actor_name: 'System/Admin',
            actor_type: 'admin',
            photos: evidencePhotoUrls,
            // Bid-acceptance carries commercial (pricing) info, so it stays
            // internal-only until an admin chooses to publish it.
            is_public: false,
            ...(aiScanResult
                ? {
                      ai_disease: aiScanResult.diagnosis,
                      ai_health_score: aiScanResult.healthScore,
                      ai_confidence: aiScanResult.confidenceScore,
                      ai_treatment_rec: aiScanResult.recommendations?.join('; ') || undefined,
                  }
                : {}),
        });
    } catch (batchError) {
        console.error('Failed to create traceability batch or log initial event:', batchError);
    }

 // Update the supply demand status
    try {
        const filledStatus =
            requiredQuantity && quantity < requiredQuantity ? 'partially_filled' : 'filled';
        await updateSupplyDemandStatus(demandId, filledStatus);
    } catch (demandErr) {
        console.error('Failed to update supply demand status:', demandErr);
    }

    return contract;
}
