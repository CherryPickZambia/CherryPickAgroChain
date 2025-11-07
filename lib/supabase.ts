import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not set');
    // Return a mock client for build time
    return null as any;
  }
  
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

export const supabase = getSupabaseClient();

// Database types
export interface Database {
  public: {
    Tables: {
      farmers: {
        Row: {
          id: string;
          wallet_address: string;
          name: string;
          email: string;
          phone: string;
          location_lat: number;
          location_lng: number;
          location_address: string;
          farm_size: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['farmers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['farmers']['Insert']>;
      };
      contracts: {
        Row: {
          id: string;
          farmer_id: string;
          crop_type: string;
          variety: string;
          required_quantity: number;
          discounted_price: number;
          standard_price: number;
          status: 'active' | 'completed' | 'cancelled';
          qr_code: string;
          created_at: string;
          harvest_date: string | null;
        };
        Insert: Omit<Database['public']['Tables']['contracts']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['contracts']['Insert']>;
      };
      milestones: {
        Row: {
          id: string;
          contract_id: string;
          name: string;
          description: string;
          expected_date: string;
          completed_date: string | null;
          status: 'pending' | 'submitted' | 'verified' | 'rejected';
          payment_amount: number;
          payment_status: 'pending' | 'processing' | 'completed';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['milestones']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['milestones']['Insert']>;
      };
      extension_officers: {
        Row: {
          id: string;
          wallet_address: string;
          name: string;
          email: string;
          phone: string;
          location_lat: number;
          location_lng: number;
          rating: number;
          completed_tasks: number;
          earnings: number;
          is_available: boolean;
          specializations: string[];
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['extension_officers']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['extension_officers']['Insert']>;
      };
      verification_tasks: {
        Row: {
          id: string;
          milestone_id: string;
          status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'rejected';
          assigned_officer_id: string | null;
          location_lat: number;
          location_lng: number;
          created_at: string;
          completed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['verification_tasks']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['verification_tasks']['Insert']>;
      };
      evidence: {
        Row: {
          id: string;
          milestone_id: string;
          photos: string[];
          notes: string;
          geo_lat: number;
          geo_lng: number;
          timestamp: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['evidence']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['evidence']['Insert']>;
      };
      payments: {
        Row: {
          id: string;
          contract_id: string;
          milestone_id: string | null;
          recipient_id: string;
          recipient_type: 'farmer' | 'officer';
          amount: number;
          transaction_hash: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          created_at: string;
          completed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['payments']['Insert']>;
      };
    };
  };
}

// Export type aliases for easier use
export type Farmer = Database['public']['Tables']['farmers']['Row'];
export type Contract = Database['public']['Tables']['contracts']['Row'];
export type Milestone = Database['public']['Tables']['milestones']['Row'];
export type ExtensionOfficer = Database['public']['Tables']['extension_officers']['Row'];
export type VerificationTask = Database['public']['Tables']['verification_tasks']['Row'];
export type Evidence = Database['public']['Tables']['evidence']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];
