// IoT Sensor Data Service
// Handles systematic capture and storage of IoT readings for analytics

import { supabase } from './supabase';

function checkSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }
  return supabase;
}

export interface IoTReading {
  id?: string;
  farmer_id: string;
  contract_id?: string;
  device_id: string;
  device_type: 'soil_sensor' | 'weather_station' | 'moisture_sensor' | 'temperature_sensor' | 'camera' | 'drone' | 'other';
  reading_type: string;
  reading_value: number;
  reading_unit: string;
  location_lat?: number;
  location_lng?: number;
  raw_data?: any;
  blockchain_tx?: string;
  created_at?: string;
}

export interface IoTDevice {
  id: string;
  name: string;
  type: IoTReading['device_type'];
  farmerId: string;
  location?: { lat: number; lng: number };
  lastReading?: Date;
  status: 'online' | 'offline' | 'error';
}

export interface SensorSummary {
  deviceId: string;
  deviceType: string;
  readingType: string;
  latestValue: number;
  unit: string;
  average24h: number;
  min24h: number;
  max24h: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

// Record a new IoT reading
export async function recordIoTReading(reading: Omit<IoTReading, 'id' | 'created_at'>): Promise<IoTReading> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('iot_readings')
    .insert(reading)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Record multiple readings at once (batch insert)
export async function recordIoTReadingsBatch(readings: Omit<IoTReading, 'id' | 'created_at'>[]): Promise<IoTReading[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('iot_readings')
    .insert(readings)
    .select();

  if (error) throw error;
  return data || [];
}

// Get readings for a specific device
export async function getDeviceReadings(
  deviceId: string,
  options?: {
    limit?: number;
    startDate?: Date;
    endDate?: Date;
    readingType?: string;
  }
): Promise<IoTReading[]> {
  const client = checkSupabase();
  let query = client
    .from('iot_readings')
    .select('*')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.startDate) {
    query = query.gte('created_at', options.startDate.toISOString());
  }

  if (options?.endDate) {
    query = query.lte('created_at', options.endDate.toISOString());
  }

  if (options?.readingType) {
    query = query.eq('reading_type', options.readingType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Get readings for a farmer
export async function getFarmerIoTReadings(
  farmerId: string,
  options?: {
    limit?: number;
    deviceType?: IoTReading['device_type'];
    startDate?: Date;
    endDate?: Date;
  }
): Promise<IoTReading[]> {
  const client = checkSupabase();
  let query = client
    .from('iot_readings')
    .select('*')
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.deviceType) {
    query = query.eq('device_type', options.deviceType);
  }

  if (options?.startDate) {
    query = query.gte('created_at', options.startDate.toISOString());
  }

  if (options?.endDate) {
    query = query.lte('created_at', options.endDate.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Get readings for a contract
export async function getContractIoTReadings(contractId: string): Promise<IoTReading[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('iot_readings')
    .select('*')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get sensor summary for dashboard
export async function getSensorSummary(farmerId: string): Promise<SensorSummary[]> {
  const client = checkSupabase();
  
  // Get last 24 hours of readings
  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);

  const { data, error } = await client
    .from('iot_readings')
    .select('*')
    .eq('farmer_id', farmerId)
    .gte('created_at', yesterday.toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Group by device and reading type
  const grouped = new Map<string, IoTReading[]>();
  (data || []).forEach((reading: IoTReading) => {
    const key = `${reading.device_id}-${reading.reading_type}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(reading);
  });

  // Calculate summaries
  const summaries: SensorSummary[] = [];
  grouped.forEach((readings, key) => {
    if (readings.length === 0) return;

    const values = readings.map(r => r.reading_value);
    const latest = readings[0];
    const oldest = readings[readings.length - 1];

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Determine trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (readings.length >= 2) {
      const diff = latest.reading_value - oldest.reading_value;
      const threshold = avg * 0.05; // 5% change threshold
      if (diff > threshold) trend = 'up';
      else if (diff < -threshold) trend = 'down';
    }

    summaries.push({
      deviceId: latest.device_id,
      deviceType: latest.device_type,
      readingType: latest.reading_type,
      latestValue: latest.reading_value,
      unit: latest.reading_unit,
      average24h: Math.round(avg * 100) / 100,
      min24h: min,
      max24h: max,
      trend,
      lastUpdated: latest.created_at!,
    });
  });

  return summaries;
}

// Get analytics data for dashboard charts
export async function getIoTAnalytics(
  farmerId: string,
  readingType: string,
  days: number = 7
): Promise<{ date: string; value: number }[]> {
  const client = checkSupabase();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await client
    .from('iot_readings')
    .select('reading_value, created_at')
    .eq('farmer_id', farmerId)
    .eq('reading_type', readingType)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Group by day and calculate daily averages
  const dailyData = new Map<string, number[]>();
  (data || []).forEach((reading: { reading_value: number; created_at: string }) => {
    const date = new Date(reading.created_at).toISOString().split('T')[0];
    if (!dailyData.has(date)) {
      dailyData.set(date, []);
    }
    dailyData.get(date)!.push(reading.reading_value);
  });

  const result: { date: string; value: number }[] = [];
  dailyData.forEach((values, date) => {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    result.push({
      date,
      value: Math.round(avg * 100) / 100,
    });
  });

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

// Simulated IoT data generator for demo purposes
export function generateMockSensorData(farmerId: string, contractId?: string): Omit<IoTReading, 'id' | 'created_at'>[] {
  const readings: Omit<IoTReading, 'id' | 'created_at'>[] = [];
  
  // Soil moisture
  readings.push({
    farmer_id: farmerId,
    contract_id: contractId,
    device_id: `SOIL-${farmerId.slice(-6)}`,
    device_type: 'soil_sensor',
    reading_type: 'soil_moisture',
    reading_value: 35 + Math.random() * 30, // 35-65%
    reading_unit: '%',
    raw_data: { sensor_model: 'SM-100', battery: 85 },
  });

  // Soil pH
  readings.push({
    farmer_id: farmerId,
    contract_id: contractId,
    device_id: `SOIL-${farmerId.slice(-6)}`,
    device_type: 'soil_sensor',
    reading_type: 'soil_ph',
    reading_value: 5.5 + Math.random() * 2, // 5.5-7.5
    reading_unit: 'pH',
    raw_data: { sensor_model: 'SM-100', battery: 85 },
  });

  // Temperature
  readings.push({
    farmer_id: farmerId,
    contract_id: contractId,
    device_id: `WX-${farmerId.slice(-6)}`,
    device_type: 'weather_station',
    reading_type: 'temperature',
    reading_value: 20 + Math.random() * 15, // 20-35°C
    reading_unit: '°C',
    raw_data: { sensor_model: 'WX-200', battery: 92 },
  });

  // Humidity
  readings.push({
    farmer_id: farmerId,
    contract_id: contractId,
    device_id: `WX-${farmerId.slice(-6)}`,
    device_type: 'weather_station',
    reading_type: 'humidity',
    reading_value: 40 + Math.random() * 40, // 40-80%
    reading_unit: '%',
    raw_data: { sensor_model: 'WX-200', battery: 92 },
  });

  // Rainfall
  readings.push({
    farmer_id: farmerId,
    contract_id: contractId,
    device_id: `WX-${farmerId.slice(-6)}`,
    device_type: 'weather_station',
    reading_type: 'rainfall',
    reading_value: Math.random() * 20, // 0-20mm
    reading_unit: 'mm',
    raw_data: { sensor_model: 'WX-200', battery: 92 },
  });

  return readings;
}

// Store AI diagnostic result
export async function storeAIDiagnostic(diagnostic: {
  farmer_id: string;
  contract_id?: string;
  photo_url: string;
  crop_type?: string;
  health_score: number;
  diagnosis: string;
  identified_issues: string[];
  recommendations: string[];
  confidence_score: number;
  ai_provider?: string;
  raw_response?: any;
  location_lat?: number;
  location_lng?: number;
}): Promise<any> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('crop_diagnostics')
    .insert(diagnostic)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get AI diagnostics for a farmer
export async function getFarmerDiagnostics(farmerId: string, limit: number = 10): Promise<any[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('crop_diagnostics')
    .select('*')
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// Get diagnostics for a contract
export async function getContractDiagnostics(contractId: string): Promise<any[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('crop_diagnostics')
    .select('*')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
