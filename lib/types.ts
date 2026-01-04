export interface Farmer {
  id: string;
  name: string;
  email: string;
  phone: string;
  walletAddress: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  farmSize: number;
  createdAt: Date;
}

export interface SmartContract {
  id: string;
  farmerId: string;
  cropType: string;
  variety: string;
  requiredQuantity: number;
  discountedPrice: number;
  standardPrice: number;
  milestones: Milestone[];
  status: "active" | "completed" | "cancelled";
  qrCode: string;
  createdAt: Date;
  harvestDate?: Date;
}

// Database Contract type (matches Supabase schema)
export interface Contract {
  id: string;
  contract_code: string;
  farmer_id: string;
  buyer_id?: string;
  crop_type: string;
  variety?: string;
  required_quantity: number;
  price_per_kg: number;
  total_value: number;
  escrow_balance?: number;
  status: "pending" | "active" | "completed" | "cancelled" | "disputed";
  created_at: string;
  harvest_date?: string | null;
  completed_at?: string;
  blockchain_tx?: string;
  ipfs_metadata?: string;
}

export interface Milestone {
  id: string;
  contractId: string;
  name: string;
  description: string;
  expectedDate: Date;
  completedDate?: Date;
  status: "pending" | "submitted" | "verified" | "rejected";
  paymentAmount: number;
  paymentStatus: "pending" | "processing" | "completed";
  farmerEvidence?: Evidence;
  verificationTask?: VerificationTask;
}

export interface Evidence {
  id: string;
  milestoneId: string;
  photos: string[];
  notes: string;
  geoLocation: {
    lat: number;
    lng: number;
  };
  timestamp: Date;
}

export interface VerificationTask {
  id: string;
  milestoneId: string;
  status: "pending" | "assigned" | "in_progress" | "completed" | "rejected";
  assignedOfficerId?: string;
  location: {
    lat: number;
    lng: number;
  };
  createdAt: Date;
  completedAt?: Date;
  officerEvidence?: OfficerEvidence;
}

export interface OfficerEvidence {
  id: string;
  taskId: string;
  photos: string[];
  sensorReadings?: {
    soilMoisture?: number;
    ec?: number;
    ph?: number;
  };
  cropHealthNotes: string;
  qualityRating: number;
  geoLocation: {
    lat: number;
    lng: number;
  };
  timestamp: Date;
}

export interface ExtensionOfficer {
  id: string;
  name: string;
  email: string;
  phone: string;
  walletAddress: string;
  location: {
    lat: number;
    lng: number;
  };
  rating: number;
  completedTasks: number;
  earnings: number;
  isAvailable: boolean;
  specializations: string[];
}

export interface Payment {
  id: string;
  contractId: string;
  milestoneId?: string;
  recipientId: string;
  recipientType: "farmer" | "officer";
  amount: number;
  transactionHash: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: Date;
  completedAt?: Date;
}

export interface TraceabilityRecord {
  id: string;
  contractId: string;
  qrCode: string;
  farmOrigin: {
    farmerId: string;
    farmerName: string;
    location: string;
  };
  cropJourney: {
    stage: string;
    location: string;
    timestamp: Date;
    notes?: string;
  }[];
  processingData?: {
    factoryId: string;
    processedDate: Date;
    batchNumber: string;
  };
  retailData?: {
    retailerId: string;
    retailerName: string;
    shelfDate: Date;
  };
}
