"use client";

// Growth & Development Tracking Service
// Handles farmer self-service evidence capture and growth activities

import { supabase } from './supabase';

function checkSupabase() {
    if (!supabase) {
        throw new Error('Supabase is not configured.');
    }
    return supabase;
}

export interface GrowthActivity {
    id?: string;
    contract_id: string;
    farmer_id: string;
    batch_id?: string;
    activity_type: 'planting' | 'weeding' | 'fertilizer' | 'pesticide' | 'irrigation' | 'pruning' | 'harvesting' | 'dispatch' | 'other';
    title: string;
    description?: string;
    date: string;
    quantity?: number;
    unit?: string;
    photos?: string[];
    iot_readings?: any;
    location_lat?: number;
    location_lng?: number;
    location_address?: string;
    // Dispatch-specific fields
    transport_type?: string;
    vehicle_registration?: string;
    driver_name?: string;
    driver_phone?: string;
    origin?: string;
    destination?: string;
    // Fertilizer-specific fields
    fertilizer_brand?: string;
    fertilizer_type?: string;
    npk_ratio?: string;
    metadata?: Record<string, any>;
    created_at?: string;
}

export async function logGrowthActivity(
    activity: Omit<GrowthActivity, 'id' | 'created_at'>
): Promise<GrowthActivity> {
    const client = checkSupabase();
    const { data, error } = await client
        .from('growth_activities')
        .insert(activity)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getGrowthActivities(
    contractId: string,
    farmerId?: string
): Promise<GrowthActivity[]> {
    const client = checkSupabase();
    let query = client
        .from('growth_activities')
        .select('*')
        .eq('contract_id', contractId)
        .order('date', { ascending: false });

    if (farmerId) {
        query = query.eq('farmer_id', farmerId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

export async function getGrowthActivitiesByFarmer(
    farmerId: string
): Promise<GrowthActivity[]> {
    const client = checkSupabase();
    const { data, error } = await client
        .from('growth_activities')
        .select('*')
        .eq('farmer_id', farmerId)
        .order('date', { ascending: false })
        .limit(50);

    if (error) throw error;
    return data || [];
}

export async function logDispatchActivity(
    contractId: string,
    farmerId: string,
    details: {
        transportType: string;
        vehicleRegistration: string;
        driverName: string;
        driverPhone?: string;
        origin: string;
        destination: string;
        quantity: number;
        unit: string;
        photos?: string[];
        location?: { lat: number; lng: number; address?: string };
    }
): Promise<GrowthActivity> {
    return logGrowthActivity({
        contract_id: contractId,
        farmer_id: farmerId,
        activity_type: 'dispatch',
        title: `Dispatch: ${details.origin} → ${details.destination}`,
        description: `${details.quantity} ${details.unit} dispatched via ${details.transportType}`,
        date: new Date().toISOString(),
        quantity: details.quantity,
        unit: details.unit,
        transport_type: details.transportType,
        vehicle_registration: details.vehicleRegistration,
        driver_name: details.driverName,
        driver_phone: details.driverPhone,
        origin: details.origin,
        destination: details.destination,
        photos: details.photos,
        location_lat: details.location?.lat,
        location_lng: details.location?.lng,
        location_address: details.location?.address,
    });
}
