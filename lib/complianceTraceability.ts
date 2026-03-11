// ============================================================
// AgroChain 360 — Compliance Traceability Service
// Standards: ISO 22005, ISO 22000/HACCP, GLOBALG.A.P., GMP
// ============================================================

import { supabase } from './supabase';

function checkSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }
  return supabase;
}

// ─────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────

export interface CropProductionLog {
  id?: string;
  farmer_id: string;
  contract_id?: string;
  batch_id?: string;
  crop_type: string;
  variety?: string;
  planting_date?: string;
  expected_harvest_date?: string;
  actual_harvest_date?: string;
  field_identifier?: string;

  // Fertilizer (GLOBALG.A.P.)
  fertilizer_type?: string;
  fertilizer_quantity?: number;
  fertilizer_unit?: string;
  fertilizer_application_date?: string;
  fertilizer_method?: string;

  // Pesticide (GLOBALG.A.P.)
  pesticide_name?: string;
  pesticide_quantity?: number;
  pesticide_unit?: string;
  pesticide_application_date?: string;
  pesticide_pre_harvest_interval_days?: number;
  pesticide_safety_data_sheet?: string;

  // Irrigation
  irrigation_method?: 'drip' | 'sprinkler' | 'flood' | 'furrow' | 'rain_fed' | 'manual' | 'other';
  irrigation_frequency?: string;
  water_source?: string;

  // Weather
  weather_conditions?: Record<string, unknown>;
  temperature_avg?: number;
  rainfall_mm?: number;

  // Soil
  soil_ph?: number;
  soil_moisture_pct?: number;

  // Seed
  seed_source?: string;
  seed_variety?: string;
  seed_treatment?: string;
  seed_lot_number?: string;

  // Evidence
  photos?: string[];
  notes?: string;
  recorded_by?: string;
  compliance_standard?: string;

  created_at?: string;
  updated_at?: string;
}

export interface FieldInspection {
  id?: string;
  farmer_id: string;
  contract_id?: string;
  batch_id?: string;
  milestone_id?: string;
  verifier_id?: string;

  inspection_date: string;
  inspection_type?: 'routine' | 'milestone' | 'random' | 'complaint' | 'follow_up';
  crop_health_status?: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

  field_photos?: string[];
  inspection_notes?: string;
  pest_observations?: string;
  disease_observations?: string;
  weed_status?: string;

  // AI
  ai_health_score?: number;
  ai_diagnosis?: string;
  ai_confidence?: number;
  ai_recommendations?: string[];

  // GLOBALG.A.P. compliance checklist
  gmp_compliance?: boolean;
  chemical_storage_ok?: boolean;
  ppe_usage_ok?: boolean;
  record_keeping_ok?: boolean;
  water_management_ok?: boolean;
  waste_management_ok?: boolean;

  overall_result?: 'pass' | 'conditional_pass' | 'fail' | 'pending';
  corrective_actions?: string;
  follow_up_required?: boolean;
  follow_up_date?: string;

  verifier_signature_ipfs?: string;
  inspection_report_ipfs?: string;
  compliance_standard?: string;

  created_at?: string;
  updated_at?: string;
}

export interface HarvestRecord {
  id?: string;
  farmer_id: string;
  contract_id?: string;
  batch_id?: string;

  harvest_date: string;
  crop_type: string;
  quantity_harvested?: number;
  unit?: string;
  quality_grade?: string;
  harvest_method?: string;
  field_identifier?: string;

  // Post-harvest (HACCP / GMP)
  sorting_done?: boolean;
  washing_done?: boolean;
  washing_method?: string;
  drying_method?: string;
  packaging_type?: string;
  packaging_material?: string;
  storage_temperature?: number;
  storage_humidity?: number;
  storage_facility?: string;
  cold_chain_maintained?: boolean;

  // Food safety (HACCP)
  contamination_check?: boolean;
  foreign_matter_check?: boolean;
  chemical_residue_test?: boolean;
  microbiological_test?: boolean;
  test_results_ipfs?: string;

  photos?: string[];
  notes?: string;
  compliance_standard?: string;

  created_at?: string;
  updated_at?: string;
}

export interface TransportRecord {
  id?: string;
  batch_id: string;
  contract_id?: string;

  transport_date: string;
  transport_mode?: 'truck' | 'van' | 'motorcycle' | 'bicycle' | 'rail' | 'other';
  vehicle_registration?: string;
  driver_name?: string;
  driver_phone?: string;
  driver_license?: string;

  origin_location?: string;
  origin_lat?: number;
  origin_lng?: number;
  destination_location?: string;
  destination_lat?: number;
  destination_lng?: number;
  estimated_arrival?: string;
  actual_arrival?: string;

  temperature_controlled?: boolean;
  avg_temperature?: number;
  humidity_controlled?: boolean;
  avg_humidity?: number;

  quantity_loaded?: number;
  quantity_received?: number;
  quantity_loss?: number;
  loss_reason?: string;

  loading_photos?: string[];
  delivery_photos?: string[];
  waybill_ipfs?: string;
  notes?: string;
  compliance_standard?: string;

  created_at?: string;
  updated_at?: string;
}

export interface ProcessingRecord {
  id?: string;
  batch_id: string;

  processing_date: string;
  processor_name?: string;
  processor_facility?: string;
  processing_type?: string;
  processing_method?: string;

  input_quantity?: number;
  output_quantity?: number;
  unit?: string;
  yield_percentage?: number;

  // GMP
  facility_clean?: boolean;
  equipment_sanitized?: boolean;
  staff_hygiene_ok?: boolean;
  temperature_monitored?: boolean;
  haccp_plan_followed?: boolean;

  quality_check_passed?: boolean;
  quality_grade?: string;
  lab_results_ipfs?: string;

  packaging_date?: string;
  packaging_type?: string;
  packaging_material?: string;
  label_info?: string;
  barcode?: string;
  best_before_date?: string;

  photos?: string[];
  notes?: string;
  compliance_standard?: string;

  created_at?: string;
  updated_at?: string;
}

// Extended farmer fields for GLOBALG.A.P. compliance
export interface FarmerComplianceFields {
  gps_lat?: number;
  gps_lng?: number;
  farm_size_hectares?: number;
  crops_grown?: string[];
  years_farming?: number;
  certifications?: Record<string, unknown>[];
  certification_docs?: string[];
  soil_type?: string;
  water_source?: string;
  farming_method?: 'conventional' | 'organic' | 'integrated' | 'conservation' | 'other';
  compliance_standards?: string[];
}

// ─────────────────────────────────────────────────
// CROP PRODUCTION LOGS
// ─────────────────────────────────────────────────

export async function createCropProductionLog(log: Omit<CropProductionLog, 'id' | 'created_at' | 'updated_at'>): Promise<CropProductionLog> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('crop_production_logs')
    .insert(log)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getCropProductionLogs(farmerId: string, contractId?: string): Promise<CropProductionLog[]> {
  const client = checkSupabase();
  let query = client
    .from('crop_production_logs')
    .select('*')
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false });

  if (contractId) {
    query = query.eq('contract_id', contractId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getCropProductionLogsByBatch(batchId: string): Promise<CropProductionLog[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('crop_production_logs')
    .select('*')
    .eq('batch_id', batchId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ─────────────────────────────────────────────────
// FIELD INSPECTIONS
// ─────────────────────────────────────────────────

export async function createFieldInspection(inspection: Omit<FieldInspection, 'id' | 'created_at' | 'updated_at'>): Promise<FieldInspection> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('field_inspections')
    .insert(inspection)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getFieldInspections(farmerId: string, batchId?: string): Promise<FieldInspection[]> {
  const client = checkSupabase();
  let query = client
    .from('field_inspections')
    .select('*')
    .eq('farmer_id', farmerId)
    .order('inspection_date', { ascending: false });

  if (batchId) {
    query = query.eq('batch_id', batchId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getFieldInspectionsByVerifier(verifierId: string): Promise<FieldInspection[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('field_inspections')
    .select('*')
    .eq('verifier_id', verifierId)
    .order('inspection_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ─────────────────────────────────────────────────
// HARVEST RECORDS
// ─────────────────────────────────────────────────

export async function createHarvestRecord(record: Omit<HarvestRecord, 'id' | 'created_at' | 'updated_at'>): Promise<HarvestRecord> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('harvest_records')
    .insert(record)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getHarvestRecords(farmerId: string, batchId?: string): Promise<HarvestRecord[]> {
  const client = checkSupabase();
  let query = client
    .from('harvest_records')
    .select('*')
    .eq('farmer_id', farmerId)
    .order('harvest_date', { ascending: false });

  if (batchId) {
    query = query.eq('batch_id', batchId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ─────────────────────────────────────────────────
// TRANSPORT RECORDS
// ─────────────────────────────────────────────────

export async function createTransportRecord(record: Omit<TransportRecord, 'id' | 'created_at' | 'updated_at'>): Promise<TransportRecord> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('transport_records')
    .insert(record)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getTransportRecords(batchId: string): Promise<TransportRecord[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('transport_records')
    .select('*')
    .eq('batch_id', batchId)
    .order('transport_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ─────────────────────────────────────────────────
// PROCESSING RECORDS
// ─────────────────────────────────────────────────

export async function createProcessingRecord(record: Omit<ProcessingRecord, 'id' | 'created_at' | 'updated_at'>): Promise<ProcessingRecord> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('processing_records')
    .insert(record)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getProcessingRecords(batchId: string): Promise<ProcessingRecord[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('processing_records')
    .select('*')
    .eq('batch_id', batchId)
    .order('processing_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ─────────────────────────────────────────────────
// FARMER COMPLIANCE UPDATE
// ─────────────────────────────────────────────────

export async function updateFarmerComplianceFields(farmerId: string, fields: FarmerComplianceFields): Promise<void> {
  const client = checkSupabase();
  const { error } = await client
    .from('farmers')
    .update(fields)
    .eq('id', farmerId);
  if (error) throw error;
}

export async function getFarmerComplianceData(farmerId: string): Promise<FarmerComplianceFields | null> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('farmers')
    .select('gps_lat, gps_lng, farm_size_hectares, crops_grown, years_farming, certifications, certification_docs, soil_type, water_source, farming_method, compliance_standards')
    .eq('id', farmerId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// ─────────────────────────────────────────────────
// FULL BATCH TRACEABILITY (aggregated view)
// ─────────────────────────────────────────────────

export interface BatchTraceabilityReport {
  batchId: string;
  productionLogs: CropProductionLog[];
  inspections: FieldInspection[];
  harvestRecords: HarvestRecord[];
  transportRecords: TransportRecord[];
  processingRecords: ProcessingRecord[];
}

export async function getFullBatchTraceability(batchId: string): Promise<BatchTraceabilityReport> {
  const [productionLogs, inspections, harvestRecords, transportRecords, processingRecords] = await Promise.all([
    getCropProductionLogsByBatch(batchId),
    getFieldInspectionsByBatch(batchId),
    getHarvestRecordsByBatch(batchId),
    getTransportRecords(batchId),
    getProcessingRecords(batchId),
  ]);

  return {
    batchId,
    productionLogs,
    inspections,
    harvestRecords,
    transportRecords,
    processingRecords,
  };
}

// Helper: get inspections by batch
async function getFieldInspectionsByBatch(batchId: string): Promise<FieldInspection[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('field_inspections')
    .select('*')
    .eq('batch_id', batchId)
    .order('inspection_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

// Helper: get harvest records by batch
async function getHarvestRecordsByBatch(batchId: string): Promise<HarvestRecord[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('harvest_records')
    .select('*')
    .eq('batch_id', batchId)
    .order('harvest_date', { ascending: false });
  if (error) throw error;
  return data || [];
}
