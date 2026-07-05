import { supabase } from "./supabase";

export interface ComplaintInput {
  batchCode?: string;
  batchId?: string;
  productName?: string;
  processingDate?: string;
  scanReference?: string;
  farmerBatch?: string;
  retailOutlet?: string;
  issueType: string;
  description?: string;
  photos?: string[];
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface Complaint extends ComplaintInput {
  id: string;
  status: string;
  created_at: string;
}

export async function submitComplaint(input: ComplaintInput): Promise<void> {
  if (!supabase) throw new Error("Service unavailable");
  const { error } = await supabase.from("complaints").insert({
    batch_code: input.batchCode || null,
    batch_id: input.batchId || null,
    product_name: input.productName || null,
    processing_date: input.processingDate || null,
    scan_reference: input.scanReference || null,
    farmer_batch: input.farmerBatch || null,
    retail_outlet: input.retailOutlet || null,
    issue_type: input.issueType,
    description: input.description || null,
    photos: input.photos || [],
    contact_name: input.contactName || null,
    contact_email: input.contactEmail || null,
    contact_phone: input.contactPhone || null,
    status: "open",
  });
  if (error) throw error;
}

export async function getComplaints(): Promise<Complaint[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error || !data) return [];
    return data.map((c: any) => ({
      id: c.id,
      status: c.status,
      created_at: c.created_at,
      batchCode: c.batch_code,
      batchId: c.batch_id,
      productName: c.product_name,
      processingDate: c.processing_date,
      scanReference: c.scan_reference,
      farmerBatch: c.farmer_batch,
      retailOutlet: c.retail_outlet,
      issueType: c.issue_type,
      description: c.description,
      photos: c.photos || [],
      contactName: c.contact_name,
      contactEmail: c.contact_email,
      contactPhone: c.contact_phone,
    }));
  } catch (e) {
    console.error("getComplaints:", e);
    return [];
  }
}

export async function updateComplaintStatus(id: string, status: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("complaints").update({ status }).eq("id", id);
  if (error) throw error;
}
