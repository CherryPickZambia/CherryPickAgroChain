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

// ==================== FARMERS ====================

export async function createFarmer(farmer: Omit<Farmer, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('farmers')
    .insert(farmer)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getFarmerByWallet(walletAddress: string) {
  const { data, error } = await supabase
    .from('farmers')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateFarmer(id: string, updates: Partial<Farmer>) {
  const { data, error } = await supabase
    .from('farmers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ==================== CONTRACTS ====================

export async function createContract(contract: Omit<Contract, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('contracts')
    .insert(contract)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getContractsByFarmer(farmerId: string) {
  const { data, error } = await supabase
    .from('contracts')
    .select('*, milestones(*)')
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getContractById(id: string) {
  const { data, error } = await supabase
    .from('contracts')
    .select('*, milestones(*), farmer:farmers(*)')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateContract(id: string, updates: Partial<Contract>) {
  const { data, error } = await supabase
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
  const { data, error } = await supabase
    .from('milestones')
    .insert(milestone)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getMilestonesByContract(contractId: string) {
  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('contract_id', contractId)
    .order('milestone_number', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function updateMilestone(id: string, updates: Partial<Milestone>) {
  const { data, error } = await supabase
    .from('milestones')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ==================== EXTENSION OFFICERS ====================

export async function createOfficer(officer: Omit<ExtensionOfficer, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('extension_officers')
    .insert(officer)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getOfficerByWallet(walletAddress: string) {
  const { data, error } = await supabase
    .from('extension_officers')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateOfficer(id: string, updates: Partial<ExtensionOfficer>) {
  const { data, error } = await supabase
    .from('extension_officers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getAvailableOfficers(location?: { lat: number; lng: number }) {
  const { data, error } = await supabase
    .from('extension_officers')
    .select('*')
    .eq('is_available', true)
    .gte('rating', 4.0);
  
  if (error) throw error;
  return data;
}

// ==================== VERIFICATION TASKS ====================

export async function createVerificationTask(task: Omit<VerificationTask, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('verification_tasks')
    .insert(task)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getAvailableTasks() {
  const { data, error } = await supabase
    .from('verification_tasks')
    .select('*, milestone:milestones(*, contract:contracts(*))')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getTasksByOfficer(officerId: string) {
  const { data, error } = await supabase
    .from('verification_tasks')
    .select('*, milestone:milestones(*, contract:contracts(*))')
    .eq('officer_id', officerId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function updateVerificationTask(id: string, updates: Partial<VerificationTask>) {
  const { data, error } = await supabase
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
  const { data, error } = await supabase
    .from('evidence')
    .insert(evidence)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getEvidenceByMilestone(milestoneId: string) {
  const { data, error } = await supabase
    .from('evidence')
    .select('*')
    .eq('milestone_id', milestoneId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

// ==================== PAYMENTS ====================

export async function createPayment(payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('payments')
    .insert(payment)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getPaymentsByContract(contractId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*, milestone:milestones(*)')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getPaymentsByFarmer(farmerId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*, milestone:milestones(*), contract:contracts(*)')
    .eq('recipient_id', farmerId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function updatePayment(id: string, updates: Partial<Payment>) {
  const { data, error } = await supabase
    .from('payments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ==================== ANALYTICS ====================

export async function getPlatformStats() {
  const [farmers, contracts, officers, payments] = await Promise.all([
    supabase.from('farmers').select('id', { count: 'exact', head: true }),
    supabase.from('contracts').select('id', { count: 'exact', head: true }),
    supabase.from('extension_officers').select('id', { count: 'exact', head: true }),
    supabase.from('payments').select('amount').eq('status', 'completed'),
  ]);

  const totalRevenue = payments.data?.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0) || 0;

  return {
    totalFarmers: farmers.count || 0,
    totalContracts: contracts.count || 0,
    totalOfficers: officers.count || 0,
    totalRevenue,
  };
}
