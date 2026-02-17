// Traceability Ledger Service
// Handles blockchain logging and QR code generation for farm-to-shelf tracking

import { supabase } from './supabase';

// Check if Supabase is configured
function checkSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  }
  return supabase;
}

export interface TraceabilityEvent {
  id?: string;
  batch_id: string;
  contract_id?: string;
  farmer_id?: string;
  event_type: TraceabilityEventType;
  event_title: string;
  event_description?: string;
  actor_id?: string;
  actor_type?: 'farmer' | 'verifier' | 'transporter' | 'warehouse' | 'processor' | 'admin';
  actor_name?: string;
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  transport_mode?: 'truck' | 'van' | 'motorcycle' | 'bicycle' | 'other';
  vehicle_registration?: string;
  driver_name?: string;
  driver_phone?: string;
  origin_location?: string;
  destination_location?: string;
  storage_facility?: string;
  storage_conditions?: {
    temperature?: number;
    humidity?: number;
    ventilation?: string;
  };
  quality_grade?: string;
  quantity?: number;
  unit?: string;
  photos?: string[];
  documents?: string[];
  iot_readings?: any;
  diagnostic_id?: string;
  blockchain_tx?: string;
  ipfs_hash?: string;
  previous_event_id?: string;
  event_hash?: string;
  created_at?: string;
}

export type TraceabilityEventType =
  | 'planting'
  | 'germination'
  | 'growth_update'
  | 'input_application'
  | 'fertilization'
  | 'irrigation'
  | 'flowering'
  | 'pest_control'
  | 'harvest'
  | 'post_harvest_handling'
  | 'quality_check'
  | 'storage'
  | 'aggregation'
  | 'transport_start'
  | 'transport_checkpoint'
  | 'warehouse_arrival'
  | 'processing'
  | 'packaging'
  | 'distribution'
  | 'retail_arrival'
  | 'verification'
  | 'ai_diagnostic';

export interface BatchMetadata {
  seeding_count?: number;
  field_size?: string;
  batch_image?: string;
  planting_date?: string;
}

export interface Contract {
  id: string;
  contract_code: string;
  crop_type: string;
  variety?: string;
  status: string;
  required_quantity: number;
}

// Get contracts by farmer (for batch creation dropdown)
export async function getContractsByFarmer(farmerId: string): Promise<Contract[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('contracts')
    .select('id, contract_code, crop_type, variety, status, required_quantity')
    .eq('farmer_id', farmerId)
    .in('status', ['active', 'in_progress'])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export interface Batch {
  id?: string;
  batch_code: string;
  contract_id?: string;
  farmer_id?: string;
  crop_type: string;
  variety?: string;
  harvest_date?: string;
  total_quantity?: number;
  unit?: string;
  quality_grade?: string;
  organic_certified?: boolean;
  current_status?: BatchStatus;
  current_location?: string;
  current_location_lat?: number;
  current_location_lng?: number;
  qr_code_url?: string;
  public_url?: string;
  blockchain_tx?: string;
  ipfs_metadata?: string;
  created_at?: string;
  updated_at?: string;
}

export type BatchStatus =
  | 'growing'
  | 'harvested'
  | 'stored'
  | 'in_transit'
  | 'at_warehouse'
  | 'processing'
  | 'packaged'
  | 'distributed'
  | 'at_retail'
  | 'sold';

// Generate unique batch code (short format for printing on packaging)
export function generateBatchCode(cropType: string, farmerId: string): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `B-${code}`;
}

// Create a new batch for tracking
export async function createBatch(batch: Omit<Batch, 'id' | 'batch_code'> & { metadata?: BatchMetadata }): Promise<Batch> {
  const client = checkSupabase();
  const batchCode = generateBatchCode(batch.crop_type, batch.farmer_id || 'UNKNOWN');

  // Prepare metadata if present
  let ipfsMetadata = batch.ipfs_metadata;
  if (batch.metadata) {
    try {
      ipfsMetadata = JSON.stringify(batch.metadata);
    } catch (e) {
      console.warn('Failed to stringify batch metadata', e);
    }
  }

  // Remove metadata object from insert payload as it's not a column
  const { metadata, ...batchData } = batch;

  const { data, error } = await client
    .from('batches')
    .insert({
      ...batchData,
      batch_code: batchCode,
      public_url: `/trace/${batchCode}`,
      ipfs_metadata: ipfsMetadata
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get batch by code (for QR code scanning)
export async function getBatchByCode(batchCode: string): Promise<Batch | null> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('batches')
    .select('*')
    .eq('batch_code', batchCode)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Get batch by ID
export async function getBatchById(id: string): Promise<Batch | null> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('batches')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Update batch status and location
export async function updateBatchStatus(
  batchId: string,
  status: BatchStatus,
  location?: string,
  lat?: number,
  lng?: number
): Promise<Batch> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('batches')
    .update({
      current_status: status,
      current_location: location,
      current_location_lat: lat,
      current_location_lng: lng,
      updated_at: new Date().toISOString(),
    })
    .eq('id', batchId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Add traceability event
export async function addTraceabilityEvent(event: Omit<TraceabilityEvent, 'id' | 'created_at'>): Promise<TraceabilityEvent> {
  const client = checkSupabase();

  // Generate event hash for verification
  const eventHash = await generateEventHash(event);

  const { data, error } = await client
    .from('traceability_events')
    .insert({
      ...event,
      event_hash: eventHash,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get all events for a batch (full traceability chain)
export async function getBatchTraceability(batchId: string): Promise<TraceabilityEvent[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('traceability_events')
    .select('*')
    .eq('batch_id', batchId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Get traceability by batch code (for public QR scanning)
export async function getTraceabilityByBatchCode(batchCodeOrContractId: string): Promise<{
  batch: Batch;
  events: TraceabilityEvent[];
  farmer?: any;
  contract?: any;
} | null> {
  const client = checkSupabase();

  // 1. Try to find batch by code
  let batch = await getBatchByCode(batchCodeOrContractId);

  // 2. If not found, try to find batch by contract_id (fallback for Contract QR codes)
  if (!batch) {
    const { data } = await client
      .from('batches')
      .select('*')
      .eq('contract_id', batchCodeOrContractId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      batch = data;
    }
  }

  // 3. If still not found, try to find by contract_code on the contracts table
  if (!batch) {
    const { data: contract } = await client
      .from('contracts')
      .select('id')
      .eq('contract_code', batchCodeOrContractId)
      .single();

    if (contract) {
      const { data } = await client
        .from('batches')
        .select('*')
        .eq('contract_id', contract.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        batch = data;
      }
    }
  }

  if (!batch) return null;

  // Get events
  const events = await getBatchTraceability(batch.id!);

  // Get farmer info if available
  let farmer = null;
  if (batch.farmer_id) {
    const { data } = await client
      .from('farmers')
      .select('name, location_address, farm_size, verified')
      .eq('id', batch.farmer_id)
      .single();
    farmer = data;
  }

  // Get contract info if available
  let contract = null;
  if (batch.contract_id) {
    const { data } = await client
      .from('contracts')
      .select('contract_code, crop_type, variety, status')
      .eq('id', batch.contract_id)
      .single();
    contract = data;
  }

  return { batch, events, farmer, contract };
}

// Generate hash for event verification
async function generateEventHash(event: any): Promise<string> {
  const eventString = JSON.stringify({
    batch_id: event.batch_id,
    event_type: event.event_type,
    event_title: event.event_title,
    timestamp: new Date().toISOString(),
    location: `${event.location_lat},${event.location_lng}`,
  });

  // Use Web Crypto API for hashing
  if (typeof window !== 'undefined' && window.crypto) {
    const encoder = new TextEncoder();
    const data = encoder.encode(eventString);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback for server-side
  return Buffer.from(eventString).toString('base64');
}

// Log farmer progress update to traceability
export async function logFarmerUpdate(
  batchId: string,
  farmerId: string,
  updateType: string,
  title: string,
  description?: string,
  photos?: string[],
  location?: { lat: number; lng: number; address?: string }
): Promise<TraceabilityEvent> {
  const eventType = updateType === 'input_application' ? 'input_application' : 'growth_update';

  return addTraceabilityEvent({
    batch_id: batchId,
    farmer_id: farmerId,
    event_type: eventType as TraceabilityEventType,
    event_title: title,
    event_description: description,
    actor_id: farmerId,
    actor_type: 'farmer',
    location_lat: location?.lat,
    location_lng: location?.lng,
    location_address: location?.address,
    photos,
  });
}

// Log transport event
export async function logTransportEvent(
  batchId: string,
  eventType: 'transport_start' | 'transport_checkpoint' | 'warehouse_arrival',
  details: {
    actorId: string;
    actorName: string;
    transportMode: 'truck' | 'van' | 'motorcycle' | 'bicycle' | 'other';
    vehicleRegistration?: string;
    driverName?: string;
    driverPhone?: string;
    origin?: string;
    destination?: string;
    location?: { lat: number; lng: number; address?: string };
    photos?: string[];
  }
): Promise<TraceabilityEvent> {
  const titles: Record<string, string> = {
    transport_start: 'Transport Started',
    transport_checkpoint: 'Transport Checkpoint',
    warehouse_arrival: 'Arrived at Warehouse',
  };

  return addTraceabilityEvent({
    batch_id: batchId,
    event_type: eventType,
    event_title: titles[eventType],
    actor_id: details.actorId,
    actor_type: 'transporter',
    actor_name: details.actorName,
    transport_mode: details.transportMode,
    vehicle_registration: details.vehicleRegistration,
    driver_name: details.driverName,
    driver_phone: details.driverPhone,
    origin_location: details.origin,
    destination_location: details.destination,
    location_lat: details.location?.lat,
    location_lng: details.location?.lng,
    location_address: details.location?.address,
    photos: details.photos,
  });
}

// Log storage event
export async function logStorageEvent(
  batchId: string,
  details: {
    actorId: string;
    actorName: string;
    facility: string;
    conditions?: { temperature?: number; humidity?: number; ventilation?: string };
    location?: { lat: number; lng: number; address?: string };
    photos?: string[];
  }
): Promise<TraceabilityEvent> {
  return addTraceabilityEvent({
    batch_id: batchId,
    event_type: 'storage',
    event_title: `Stored at ${details.facility}`,
    actor_id: details.actorId,
    actor_type: 'warehouse',
    actor_name: details.actorName,
    storage_facility: details.facility,
    storage_conditions: details.conditions,
    location_lat: details.location?.lat,
    location_lng: details.location?.lng,
    location_address: details.location?.address,
    photos: details.photos,
  });
}

// Log verification event
export async function logVerificationEvent(
  batchId: string,
  verifierId: string,
  verifierName: string,
  qualityGrade?: string,
  notes?: string,
  photos?: string[],
  location?: { lat: number; lng: number; address?: string }
): Promise<TraceabilityEvent> {
  return addTraceabilityEvent({
    batch_id: batchId,
    event_type: 'verification',
    event_title: 'Quality Verification Completed',
    event_description: notes,
    actor_id: verifierId,
    actor_type: 'verifier',
    actor_name: verifierName,
    quality_grade: qualityGrade,
    location_lat: location?.lat,
    location_lng: location?.lng,
    location_address: location?.address,
    photos,
  });
}

// Log AI diagnostic to traceability
export async function logAIDiagnostic(
  batchId: string,
  farmerId: string,
  diagnosticId: string,
  healthScore: number,
  diagnosis: string,
  location?: { lat: number; lng: number }
): Promise<TraceabilityEvent> {
  return addTraceabilityEvent({
    batch_id: batchId,
    farmer_id: farmerId,
    event_type: 'ai_diagnostic',
    event_title: `AI Health Check: ${healthScore}/100`,
    event_description: diagnosis,
    actor_id: farmerId,
    actor_type: 'farmer',
    diagnostic_id: diagnosticId,
    location_lat: location?.lat,
    location_lng: location?.lng,
  });
}

// Get batches by farmer
export async function getBatchesByFarmer(farmerId: string): Promise<Batch[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('batches')
    .select('*')
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get batches by contract
export async function getBatchesByContract(contractId: string): Promise<Batch[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('batches')
    .select('*')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Milestone to traceability event type mapping
const MILESTONE_EVENT_MAP: Record<string, { eventType: TraceabilityEventType; title: string; status: BatchStatus }> = {
  'Land Preparation': { eventType: 'planting', title: 'Land prepared for planting', status: 'growing' },
  'Planting Complete': { eventType: 'germination', title: 'Planting completed', status: 'growing' },
  'Seedling Stage': { eventType: 'growth_update', title: 'Seedling stage reached', status: 'growing' },
  'Growth Stage': { eventType: 'growth_update', title: 'Growth milestone achieved', status: 'growing' },
  'Flowering Stage': { eventType: 'flowering', title: 'Flowering stage reached', status: 'growing' },
  'Harvest Ready': { eventType: 'harvest', title: 'Harvest completed', status: 'harvested' },
  'Harvest Complete': { eventType: 'harvest', title: 'Harvest completed', status: 'harvested' },
  'Quality Check': { eventType: 'quality_check', title: 'Quality inspection passed', status: 'harvested' },
  'Storage': { eventType: 'storage', title: 'Stored at farm facility', status: 'stored' },
  'Transport Started': { eventType: 'transport_start', title: 'Transport to warehouse initiated', status: 'in_transit' },
  'At Warehouse': { eventType: 'warehouse_arrival', title: 'Arrived at processing facility', status: 'at_warehouse' },
  'Processing Complete': { eventType: 'processing', title: 'Processing completed', status: 'processing' },
  'Packaging': { eventType: 'packaging', title: 'Packaging completed', status: 'packaged' },
  'Distribution': { eventType: 'distribution', title: 'Shipped for distribution', status: 'distributed' },
  'Retail Ready': { eventType: 'retail_arrival', title: 'Available at retail location', status: 'at_retail' },
};

// Create traceability event from milestone status change
export async function logMilestoneEvent(
  batchId: string,
  milestoneName: string,
  farmerId: string,
  farmerName: string,
  notes?: string,
  images?: string[]
): Promise<TraceabilityEvent | null> {
  const mapping = MILESTONE_EVENT_MAP[milestoneName];
  if (!mapping) {
    console.log(`No traceability mapping for milestone: ${milestoneName}`);
    return null;
  }

  // Update batch status
  try {
    await updateBatchStatus(batchId, mapping.status);
  } catch (e) {
    console.error('Error updating batch status:', e);
  }

  // Create traceability event
  return addTraceabilityEvent({
    batch_id: batchId,
    farmer_id: farmerId,
    event_type: mapping.eventType,
    event_title: mapping.title,
    event_description: notes || `${milestoneName} milestone verified for batch`,
    actor_id: farmerId,
    actor_type: 'farmer',
    actor_name: farmerName,
    photos: images,
  });
}

// Auto-create batch when contract is created
export async function createBatchForContract(
  contractId: string,
  farmerId: string,
  cropType: string,
  variety?: string,
  quantity?: number,
  unit?: string
): Promise<Batch> {
  const batch = await createBatch({
    contract_id: contractId,
    farmer_id: farmerId,
    crop_type: cropType,
    variety: variety,
    total_quantity: quantity,
    unit: unit || 'kg',
    current_status: 'growing',
    organic_certified: false,
  });

  // Log initial planting event
  await addTraceabilityEvent({
    batch_id: batch.id!,
    contract_id: contractId,
    farmer_id: farmerId,
    event_type: 'planting',
    event_title: 'Contract initiated - Production started',
    event_description: `New batch created for ${cropType} contract. Tracking begins.`,
    actor_id: farmerId,
    actor_type: 'farmer',
  });

  return batch;
}

// Log warehouse processing events
export async function logProcessingEvent(
  batchId: string,
  processingType: 'quality_check' | 'sorting' | 'drying' | 'packaging' | 'distribution',
  details: {
    title: string;
    description: string;
    actorName: string;
    grade?: string;
    quantity?: number;
    method?: string;
    packageCount?: number;
    packageType?: string;
  }
): Promise<TraceabilityEvent> {
  const eventTypeMap: Record<string, TraceabilityEventType> = {
    'quality_check': 'quality_check',
    'sorting': 'processing',
    'drying': 'processing',
    'packaging': 'packaging',
    'distribution': 'distribution',
  };

  const statusMap: Record<string, BatchStatus> = {
    'quality_check': 'at_warehouse',
    'sorting': 'processing',
    'drying': 'processing',
    'packaging': 'packaged',
    'distribution': 'distributed',
  };

  // Update batch status
  try {
    await updateBatchStatus(batchId, statusMap[processingType]);
  } catch (e) {
    console.error('Error updating batch status:', e);
  }

  return addTraceabilityEvent({
    batch_id: batchId,
    event_type: eventTypeMap[processingType],
    event_title: details.title,
    event_description: details.description,
    actor_type: 'warehouse',
    actor_name: details.actorName,
    quality_grade: details.grade,
    quantity: details.quantity,
  });
}

// Get all batches (for admin traceability dashboard)
export async function getAllBatches(): Promise<(Batch & { farmer_name?: string })[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('batches')
    .select('*, farmer:farmers(name)')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((b: any) => ({
    ...b,
    farmer_name: b.farmer?.name || 'Unknown',
  }));
}

// Get recent traceability events across all batches (for admin dashboard timeline)
export async function getRecentTraceabilityEvents(limit: number = 20): Promise<(TraceabilityEvent & { batch_code?: string })[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('traceability_events')
    .select('*, batch:batches(batch_code)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map((e: any) => ({
    ...e,
    batch_code: e.batch?.batch_code || e.batch_id,
  }));
}

