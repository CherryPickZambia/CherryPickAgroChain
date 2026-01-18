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

// Generate unique batch code
export function generateBatchCode(cropType: string, farmerId: string): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const cropCode = cropType.slice(0, 3).toUpperCase();
  const farmerCode = farmerId.slice(-4).toUpperCase();
  const random = Math.random().toString(36).slice(-4).toUpperCase();

  return `CP-${cropCode}-${year}${month}${day}-${farmerCode}-${random}`;
}

// Create a new batch for tracking
export async function createBatch(batch: Omit<Batch, 'id' | 'batch_code'>): Promise<Batch> {
  const client = checkSupabase();
  const batchCode = generateBatchCode(batch.crop_type, batch.farmer_id || 'UNKNOWN');

  const { data, error } = await client
    .from('batches')
    .insert({
      ...batch,
      batch_code: batchCode,
      public_url: `/trace/${batchCode}`,
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
export async function getTraceabilityByBatchCode(batchCode: string): Promise<{
  batch: Batch;
  events: TraceabilityEvent[];
  farmer?: any;
  contract?: any;
} | null> {
  const client = checkSupabase();

  // Get batch
  const batch = await getBatchByCode(batchCode);
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
