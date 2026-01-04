import { supabase } from './supabase';
import type { 
  Farmer, 
  Contract, 
  Milestone, 
  ExtensionOfficer, 
  VerificationTask, 
  Evidence, 
  Payment 
} from './supabase';

// Helper to check if Supabase is configured
function checkSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  }
  return supabase;
}

// ==================== USERS ====================

export interface User {
  id: string;
  wallet_address: string;
  role: 'farmer' | 'buyer' | 'officer' | 'admin';
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export async function createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at' | 'verified'>) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('users')
    .insert({
      ...user,
      verified: false,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getUserByWallet(walletAddress: string): Promise<User | null> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateUser(id: string, updates: Partial<User>) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateUserByWallet(walletAddress: string, updates: Partial<User>) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('wallet_address', walletAddress)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getUsers() {
  const client = checkSupabase();
  const { data, error } = await client
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function getUsersByRole(role: string) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('role', role)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// Get or create user - ensures user exists in database
export async function getOrCreateUser(walletAddress: string, role: 'farmer' | 'buyer' | 'officer' | 'admin', name?: string): Promise<User> {
  // Try to get existing user
  const existingUser = await getUserByWallet(walletAddress);
  
  if (existingUser) {
    // Update role if different (for admin promotions)
    if (existingUser.role !== role) {
      const updatedUser = await updateUserByWallet(walletAddress, { role });
      return updatedUser as User;
    }
    return existingUser;
  }
  
  // Create new user
  const newUser = await createUser({
    wallet_address: walletAddress,
    role,
    name: name || `User ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
  });
  
  return newUser as User;
}

// ==================== FARMERS ====================

export async function createFarmer(farmer: Omit<Farmer, 'id' | 'created_at' | 'updated_at'>) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('farmers')
    .insert(farmer)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getFarmerByWallet(walletAddress: string) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('farmers')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateFarmer(id: string, updates: Partial<Farmer>) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('farmers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getFarmers() {
  const client = checkSupabase();
  const { data, error } = await client
    .from('farmers')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function approveFarmer(id: string) {
  return updateFarmer(id, { status: 'approved' });
}

export async function rejectFarmer(id: string, reason?: string) {
  return updateFarmer(id, { 
    status: 'rejected',
    rejection_reason: reason 
  });
}

// ==================== CONTRACTS ====================

export async function createContract(contract: Omit<Contract, 'id' | 'created_at' | 'updated_at'>) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('contracts')
    .insert(contract)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getContractsByFarmer(farmerId: string) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('contracts')
    .select('*, milestones(*)')
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getContractById(id: string) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('contracts')
    .select('*, milestones(*), farmer:farmers(*)')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateContract(id: string, updates: Partial<Contract>) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('contracts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ==================== MILESTONES ====================

export async function createMilestone(milestone: Omit<Milestone, 'id' | 'created_at' | 'updated_at'>) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('milestones')
    .insert(milestone)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getMilestonesByContract(contractId: string) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('milestones')
    .select('*')
    .eq('contract_id', contractId)
    .order('milestone_number', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function updateMilestone(id: string, updates: Partial<Milestone>) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('milestones')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function submitMilestoneEvidence(
  milestoneId: string,
  evidence: {
    images: string[];
    iot_readings: any[];
    notes: string;
  }
) {
  const client = checkSupabase();
  // Create evidence record
  const { data: evidenceData, error: evidenceError } = await client
    .from('evidence')
    .insert({
      milestone_id: milestoneId,
      evidence_type: 'photo',
      ipfs_hash: evidence.images[0], // Store first image as main hash
      metadata: {
        images: evidence.images,
        iot_readings: evidence.iot_readings,
        notes: evidence.notes,
        submitted_at: new Date().toISOString(),
      },
    })
    .select()
    .single();

  if (evidenceError) throw evidenceError;

  // Update milestone status to submitted
  const { data: milestoneData, error: milestoneError } = await client
    .from('milestones')
    .update({
      status: 'submitted',
      completed_date: new Date().toISOString(),
    })
    .eq('id', milestoneId)
    .select()
    .single();

  if (milestoneError) throw milestoneError;

  return { evidence: evidenceData, milestone: milestoneData };
}

// ==================== EXTENSION OFFICERS ====================

export async function createOfficer(officer: Omit<ExtensionOfficer, 'id' | 'created_at' | 'updated_at'>) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('extension_officers')
    .insert(officer)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getOfficerByWallet(walletAddress: string) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('extension_officers')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateOfficer(id: string, updates: Partial<ExtensionOfficer>) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('extension_officers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getAvailableOfficers(location?: { lat: number; lng: number }) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('extension_officers')
    .select('*')
    .eq('is_available', true)
    .gte('rating', 4.0);
  
  if (error) throw error;
  return data;
}

// ==================== VERIFICATION TASKS ====================

export async function createVerificationTask(task: Omit<VerificationTask, 'id' | 'created_at' | 'updated_at'>) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('verification_tasks')
    .insert(task)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getAvailableTasks() {
  const client = checkSupabase();
  const { data, error } = await client
    .from('verification_tasks')
    .select('*, milestone:milestones(*, contract:contracts(*))')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getTasksByOfficer(officerId: string) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('verification_tasks')
    .select('*, milestone:milestones(*, contract:contracts(*))')
    .eq('officer_id', officerId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function updateVerificationTask(id: string, updates: Partial<VerificationTask>) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('verification_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ==================== EVIDENCE ====================

export async function createEvidence(evidence: Omit<Evidence, 'id' | 'created_at'>) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('evidence')
    .insert(evidence)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getEvidenceByMilestone(milestoneId: string) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('evidence')
    .select('*')
    .eq('milestone_id', milestoneId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

// ==================== PAYMENTS ====================

export async function createPayment(payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('payments')
    .insert(payment)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getPaymentsByContract(contractId: string) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('payments')
    .select('*, milestone:milestones(*)')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getPaymentsByFarmer(farmerId: string) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('payments')
    .select('*, milestone:milestones(*), contract:contracts(*)')
    .eq('recipient_id', farmerId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function updatePayment(id: string, updates: Partial<Payment>) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('payments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ==================== ADMIN APPROVAL ====================

export async function approveMilestone(
  milestoneId: string,
  adminNotes: string,
  releasePayment: boolean = false
) {
  const client = checkSupabase();
  // Update milestone status to verified
  const { data: milestoneData, error: milestoneError } = await client
    .from('milestones')
    .update({
      status: 'verified',
      metadata: {
        admin_notes: adminNotes,
        approved_at: new Date().toISOString(),
        payment_released: releasePayment,
      },
    })
    .eq('id', milestoneId)
    .select()
    .single();

  if (milestoneError) throw milestoneError;

  // If payment should be released, update payment status
  if (releasePayment) {
    await client
      .from('milestones')
      .update({
        payment_status: 'completed',
      })
      .eq('id', milestoneId);
  }

  return milestoneData;
}

export async function rejectMilestone(
  milestoneId: string,
  adminNotes: string
) {
  const client = checkSupabase();
  const { data, error } = await client
    .from('milestones')
    .update({
      status: 'rejected',
      metadata: {
        admin_notes: adminNotes,
        rejected_at: new Date().toISOString(),
      },
    })
    .eq('id', milestoneId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getMilestonesForAdminReview() {
  const client = checkSupabase();
  const { data, error } = await client
    .from('milestones')
    .select(`
      *,
      contract:contracts(
        id,
        crop_type,
        farmer_id,
        farmer:farmers(
          name,
          wallet_address,
          location_address
        )
      ),
      evidence(*)
    `)
    .eq('status', 'submitted')
    .order('completed_date', { ascending: true });

  if (error) throw error;
  return data;
}

// ==================== ANALYTICS ====================

export async function getPlatformStats() {
  const client = checkSupabase();
  const [farmers, contracts, officers, payments] = await Promise.all([
    client.from('farmers').select('id', { count: 'exact', head: true }),
    client.from('contracts').select('id', { count: 'exact', head: true }),
    client.from('extension_officers').select('id', { count: 'exact', head: true }),
    client.from('payments').select('amount').eq('status', 'completed'),
  ]);

  const totalRevenue = payments.data?.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0) || 0;

  return {
    totalFarmers: farmers.count || 0,
    totalContracts: contracts.count || 0,
    totalOfficers: officers.count || 0,
    totalRevenue,
  };
}
