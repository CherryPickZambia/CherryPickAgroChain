# AgroChain360 Updated Workflow Documentation

## Overview

This document describes the updated workflow based on your requirements:
1. **Admin creates contracts** (not farmers)
2. **Admin onboards farmers** with approval process
3. **AI-suggested milestones** based on crop type
4. **Evidence upload** with photos, IoT sensors, and AI diagnostics
5. **Blockchain traceability** for complete farm-to-table tracking

---

## 1. Farmer Onboarding Process

### Option A: Admin-Initiated Onboarding (Recommended)

**Flow:**
```
Admin → Creates farmer profile → Farmer receives invitation → Farmer completes profile → Auto-approved
```

**Steps:**
1. Admin logs into Admin Dashboard
2. Navigates to "Farmers" section
3. Clicks "Add New Farmer"
4. Enters farmer details:
   - Name
   - Email
   - Phone
   - Location (GPS coordinates)
   - Farm size
   - Wallet address (optional, can be created)
5. System sends invitation to farmer
6. Farmer status: `approved` (immediate)

### Option B: Self-Onboarding with Admin Approval

**Flow:**
```
Farmer → Self-registers → Submits application → Admin reviews → Approves/Rejects
```

**Steps:**
1. Farmer visits platform
2. Clicks "Register as Farmer"
3. Fills out application form:
   - Personal details
   - Farm information
   - Location
   - Supporting documents (optional)
4. Submits application
5. Farmer status: `pending`
6. Admin receives notification
7. Admin reviews application
8. Admin approves or rejects with reason
9. Farmer receives notification of decision

**Database Schema:**
```sql
ALTER TABLE farmers ADD COLUMN status TEXT DEFAULT 'pending';
ALTER TABLE farmers ADD COLUMN rejection_reason TEXT;
-- status values: 'pending', 'approved', 'rejected'
```

---

## 2. Contract Creation (Admin-Only)

### Workflow

**Only admins can create contracts**

**Steps:**

1. **Admin Dashboard → Contracts → Create New Contract**

2. **Step 1: Select Farmer & Crop**
   - Choose from approved farmers only
   - Select crop type (Mango, Tomato, Pineapple, etc.)
   - Enter crop variety

3. **Step 2: Contract Terms**
   - Required quantity (kg)
   - Contract price per kg
   - Market price per kg
   - Expected harvest date
   - System calculates total contract value

4. **Step 3: Setup Milestones (AI-Powered)**
   - Click "AI Generate" button
   - System suggests 4-6 milestones based on crop type
   - Admin can:
     - Accept AI suggestions
     - Customize milestone names/descriptions
     - Adjust payment percentages
     - Modify timeline (days from start)
     - Add custom milestones
     - Remove milestones
   - **Validation**: Payment percentages must sum to 100%

5. **Contract Created**
   - Saved to database
   - Farmer notified
   - QR code generated
   - NFT minted on blockchain (optional)

### AI Milestone Generation

**Example for Mangoes (90-day cycle):**

| Milestone | Description | Payment % | Days |
|-----------|-------------|-----------|------|
| Land Preparation Complete | Land cleared, plowed, and prepared | 10% | 0 |
| Planting Verified | Seedlings planted and watered | 15% | 7 |
| First Growth Check | 95% seedling survival confirmed | 15% | 30 |
| Flowering Stage | Trees flowering, fruit set beginning | 15% | 60 |
| Pre-Harvest Inspection | Quality check, pest control verified | 20% | 85 |
| Harvest & Delivery | Crop harvested and delivered | 25% | 90 |

**Example for Tomatoes (75-day cycle):**

| Milestone | Description | Payment % | Days |
|-----------|-------------|-----------|------|
| Nursery Establishment | Seedlings germinated | 15% | 0 |
| Transplanting Complete | Seedlings moved to field | 15% | 21 |
| First Flowering | Plants flowering | 20% | 35 |
| First Harvest | Initial harvest | 25% | 60 |
| Final Harvest | Complete harvest | 25% | 75 |

---

## 3. Milestone Evidence Upload (Farmer)

### Updated UI (Matching Your Image)

**Milestone Card Design:**
```
┌─────────────────────────────────────────┐
│ Planting Complete        [completed]    │
│ Successfully planted 500 mango seedlings│
│ Date: 2024-03-15                        │
│ Payment: K1,500                         │
│ ┌─────────────────────────────────────┐ │
│ │  [Upload Icon] Upload Milestone     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Evidence Upload Process

**What Farmers Upload:**

1. **Photos (Required)**
   - Pictures of produce at each stage
   - Examples:
     - Planting: Seedlings in ground
     - Flowering: Trees with flowers
     - Fruit setting: Young fruits
     - Pre-harvest: Mature fruits
     - Harvest: Harvested produce
   - Maximum 10 images per milestone
   - Stored on IPFS (permanent, tamper-proof)

2. **IoT Sensor Readings (Optional)**
   - Temperature (°C)
   - Humidity (%)
   - Soil moisture (%)
   - pH level
   - Automatically synced from IoT devices
   - Timestamp recorded

3. **AI Diagnostics (Optional)**
   - Crop health analysis
   - Disease detection
   - Growth rate assessment
   - Quality prediction
   - Generated from uploaded photos

4. **Additional Notes (Optional)**
   - Text description
   - Challenges faced
   - Actions taken
   - Observations

### Upload Flow

```
Farmer Dashboard → Active Contract → Milestone Card → "Upload Milestone" Button
↓
Evidence Upload Modal Opens
↓
1. Upload Photos (drag & drop or select)
   - Preview thumbnails shown
   - Can remove/replace
↓
2. Add IoT Readings
   - Select sensor type
   - Enter value
   - Auto-timestamp
↓
3. AI Diagnostics (Auto-Generated)
   - System analyzes uploaded photos
   - Generates health report
   - Detects issues
↓
4. Add Notes
   - Text area for additional info
↓
5. Submit Evidence
   - Uploads to IPFS
   - Saves IPFS hash to database
   - Updates milestone status to "submitted"
   - Creates verification task for officer
   - Farmer receives confirmation
```

---

## 4. Officer Verification

### Workflow

```
Officer receives notification
↓
Views milestone evidence
↓
Visits farm for on-site inspection
↓
Verifies evidence authenticity
↓
Takes additional photos
↓
Records verification notes
↓
Approves or Rejects milestone
↓
If approved: Payment automatically released
If rejected: Farmer notified with reason
```

### Verification Checklist

- [ ] Photos match actual farm conditions
- [ ] IoT readings are reasonable
- [ ] Crop health matches AI diagnostics
- [ ] Milestone criteria met
- [ ] No signs of fraud or misrepresentation

---

## 5. Blockchain Traceability

### Complete Farm-to-Table Journey

**Every piece of evidence forms part of the traceability history**

### Data Stored On-Chain

1. **Contract Creation**
   - Farmer address
   - Crop type & variety
   - Quantity
   - Contract value
   - Milestone definitions

2. **Each Milestone**
   - Farmer evidence (IPFS hash)
   - Officer verification (IPFS hash)
   - IoT readings
   - AI diagnostics
   - Timestamp
   - GPS location
   - Payment transaction hash

3. **Harvest & Processing**
   - Harvest date
   - Quantity delivered
   - Quality grade
   - Processing location
   - Batch number

4. **Distribution**
   - Packaging date
   - Cold chain data
   - Shipment tracking
   - Retail location

### QR Code Scanning (Consumer)

**When a consumer scans the QR code on a product:**

```
QR Code → Blockchain Lookup → Display Complete Journey
```

**Information Shown:**

```
┌─────────────────────────────────────────┐
│   🌾 Farm-to-Table Journey              │
├─────────────────────────────────────────┤
│ Farmer: John Banda                      │
│ Farm: Lusaka, Zambia                    │
│ [Map showing farm location]             │
├─────────────────────────────────────────┤
│ 📅 Timeline:                            │
│                                         │
│ ✓ Planted: Jan 1, 2024                 │
│   [View 3 photos] [IoT: 25°C, 65% RH]  │
│                                         │
│ ✓ First Growth: Jan 30, 2024           │
│   [View 5 photos] [AI: 95% healthy]    │
│                                         │
│ ✓ Flowering: Mar 1, 2024               │
│   [View 4 photos] [IoT: 28°C, 70% RH]  │
│                                         │
│ ✓ Pre-Harvest: Mar 25, 2024            │
│   [View 6 photos] [AI: Grade A]        │
│                                         │
│ ✓ Harvested: Mar 30, 2024              │
│   [View 8 photos] [1000kg delivered]   │
│                                         │
│ ✓ Processed: Mar 31, 2024              │
│   Cherry-Pick Factory, Lusaka           │
│   Batch: CP-2024-045                    │
│                                         │
│ ✓ Packaged: Apr 2, 2024                │
│   Cold storage: 4°C maintained          │
│                                         │
│ ✓ Retail: Apr 5, 2024                  │
│   Shoprite Lusaka                       │
│   Shelf date: Apr 5, 2024              │
│   Freshness: 6 days ✓                   │
├─────────────────────────────────────────┤
│ 🏆 Certifications:                      │
│ ✓ Organic                               │
│ ✓ GlobalGAP                             │
│ ✓ Blockchain Verified                   │
├─────────────────────────────────────────┤
│ 🌡️ Cold Chain Compliance:              │
│ ✓ Temperature maintained 4°C            │
│ ✓ No breaks in cold chain               │
├─────────────────────────────────────────┤
│ 🔗 Blockchain Proof:                    │
│ Contract: 0xABC...123                   │
│ NFT Token: #456                         │
│ [View on BaseScan]                      │
└─────────────────────────────────────────┘
```

### Benefits of Blockchain Traceability

**For Consumers:**
- ✅ Complete transparency
- ✅ Verify food origin
- ✅ Check freshness
- ✅ Confirm certifications
- ✅ Support farmers directly

**For Cherry-Pick:**
- ✅ Build consumer trust
- ✅ Premium branding
- ✅ Reduce fraud
- ✅ Compliance with regulations
- ✅ Competitive advantage

**For Farmers:**
- ✅ Proof of quality
- ✅ Premium pricing
- ✅ Direct consumer connection
- ✅ Reputation building

---

## 6. Technical Implementation

### Database Schema Updates

```sql
-- Add status fields to farmers table
ALTER TABLE farmers 
ADD COLUMN status TEXT DEFAULT 'pending',
ADD COLUMN rejection_reason TEXT;

-- Add evidence fields to milestones table
ALTER TABLE milestones 
ADD COLUMN farmer_evidence JSONB,
ADD COLUMN officer_evidence JSONB,
ADD COLUMN iot_readings JSONB,
ADD COLUMN ai_diagnostics JSONB;

-- Example farmer_evidence structure:
{
  "images": ["ipfs://Qm...", "ipfs://Qm..."],
  "notes": "Successfully planted 500 seedlings",
  "location": { "lat": -15.4167, "lng": 28.2833 },
  "timestamp": "2024-03-15T10:30:00Z"
}

-- Example iot_readings structure:
[
  {
    "type": "temperature",
    "value": 25.5,
    "unit": "°C",
    "timestamp": "2024-03-15T10:30:00Z"
  },
  {
    "type": "humidity",
    "value": 65,
    "unit": "%",
    "timestamp": "2024-03-15T10:30:00Z"
  }
]

-- Example ai_diagnostics structure:
{
  "health_score": 95,
  "diseases_detected": [],
  "growth_rate": "normal",
  "quality_prediction": "Grade A",
  "recommendations": ["Continue current care routine"]
}
```

### Component Structure

```
components/
├── AdminCreateContractModal.tsx       ← NEW: Admin-only contract creation
├── MilestoneCardUpdated.tsx           ← NEW: Updated UI matching your image
├── EvidenceUploadModal.tsx            ← UPDATED: Photos + IoT + AI
├── FarmerOnboardingForm.tsx           ← NEW: Self-registration form
├── AdminApprovalModal.tsx             ← EXISTING: Approve/reject farmers
└── QRTraceabilityView.tsx             ← NEW: Consumer-facing traceability
```

### API Endpoints

```typescript
// Farmer Management
POST   /api/farmers/register          // Self-registration
GET    /api/farmers/pending           // Admin: Get pending farmers
POST   /api/farmers/:id/approve       // Admin: Approve farmer
POST   /api/farmers/:id/reject        // Admin: Reject farmer

// Contract Management (Admin Only)
POST   /api/contracts/create          // Admin: Create contract
POST   /api/contracts/:id/milestones  // Admin: Add milestones
GET    /api/contracts/:id/ai-milestones // Get AI suggestions

// Evidence Upload (Farmer)
POST   /api/milestones/:id/evidence   // Upload evidence
POST   /api/ipfs/upload               // Upload to IPFS
POST   /api/ai/analyze                // AI diagnostics

// Verification (Officer)
POST   /api/milestones/:id/verify     // Verify milestone
POST   /api/milestones/:id/reject     // Reject milestone

// Traceability (Public)
GET    /api/traceability/:qrCode      // Get complete journey
GET    /api/nft/:tokenId/history      // Get NFT history
```

---

## 7. AI Integration

### Milestone Generation AI

**Input:**
- Crop type
- Variety
- Farm size
- Expected harvest date
- Historical data

**Output:**
- 4-6 optimized milestones
- Payment distribution
- Timeline (days from start)
- Descriptions

**Algorithm:**
```python
def generate_milestones(crop_type, variety, harvest_date):
    # Load crop-specific templates
    template = load_template(crop_type)
    
    # Adjust based on variety and season
    adjusted = adjust_for_variety(template, variety)
    
    # Optimize payment distribution
    payments = optimize_payments(adjusted)
    
    # Calculate timeline
    timeline = calculate_timeline(harvest_date)
    
    return milestones
```

### Crop Health AI

**Input:**
- Photos of crops
- IoT sensor readings
- Historical data
- Weather data

**Output:**
- Health score (0-100)
- Diseases detected
- Growth rate assessment
- Quality prediction
- Recommendations

**Model:**
- Computer vision (ResNet/EfficientNet)
- Trained on agricultural datasets
- Real-time inference
- Confidence scores

---

## 8. Complete User Flows

### Flow 1: Admin Creates Contract

```
1. Admin logs in
2. Navigates to Contracts
3. Clicks "Create New Contract"
4. Selects approved farmer from dropdown
5. Selects crop type (e.g., Mango)
6. Enters variety (e.g., Kent)
7. Enters contract terms:
   - Quantity: 1000 kg
   - Contract price: K15/kg
   - Market price: K18/kg
   - Harvest date: 90 days
8. Clicks "Next: Setup Milestones"
9. Clicks "AI Generate"
10. AI suggests 6 milestones (10%, 15%, 15%, 15%, 20%, 25%)
11. Admin reviews and customizes if needed
12. Clicks "Create Contract"
13. Contract saved to database
14. NFT minted on blockchain
15. Farmer receives notification
16. QR code generated
```

### Flow 2: Farmer Uploads Evidence

```
1. Farmer logs in
2. Views active contract
3. Sees milestone card: "Planting Complete" (pending)
4. Clicks "Upload Milestone" button
5. Evidence upload modal opens
6. Farmer uploads 5 photos of planted seedlings
7. Adds IoT reading: Temperature 25°C
8. Adds IoT reading: Humidity 65%
9. Enters notes: "Successfully planted 500 seedlings"
10. Clicks "Submit Evidence"
11. Photos uploaded to IPFS
12. AI analyzes photos → Health score: 95%
13. Evidence saved to database
14. Milestone status → "submitted"
15. Verification task created for officer
16. Farmer receives confirmation
17. Officer receives notification
```

### Flow 3: Officer Verifies Milestone

```
1. Officer receives notification
2. Views milestone evidence:
   - 5 farmer photos
   - IoT readings
   - AI diagnostics
   - Farmer notes
3. Visits farm for on-site inspection
4. Takes 3 verification photos
5. Confirms evidence is accurate
6. Enters verification notes
7. Clicks "Approve Milestone"
8. Smart contract triggered
9. Payment released to farmer (15% of K15,000 = K2,250)
10. Officer receives verification fee (K50)
11. Milestone status → "verified"
12. Farmer receives payment notification
13. Evidence recorded on blockchain
14. Next milestone unlocked
```

### Flow 4: Consumer Scans QR Code

```
1. Consumer buys mango at Shoprite
2. Scans QR code on package
3. Mobile app opens
4. Blockchain lookup performed
5. Complete journey displayed:
   - Farmer: John Banda
   - Farm location: Lusaka
   - 6 milestones with photos
   - IoT readings at each stage
   - AI health reports
   - Harvest date: Mar 30, 2024
   - Processing: Mar 31, 2024
   - Freshness: 6 days ✓
   - Certifications: Organic ✓
6. Consumer views farmer profile
7. Consumer sees all verification records
8. Consumer trusts product authenticity
9. Consumer shares on social media
10. Cherry-Pick brand reputation enhanced
```

---

## 9. Key Differences from Original

### Original Workflow:
- ❌ Farmers create their own contracts
- ❌ Farmers self-onboard without approval
- ❌ Manual milestone creation
- ❌ Basic evidence upload (photos only)
- ❌ Limited traceability

### Updated Workflow:
- ✅ **Admin creates all contracts**
- ✅ **Admin approves farmer onboarding**
- ✅ **AI-powered milestone generation**
- ✅ **Comprehensive evidence**: Photos + IoT + AI diagnostics
- ✅ **Complete blockchain traceability** for QR scanning
- ✅ **Professional milestone UI** matching your design
- ✅ **Consumer-facing traceability app**

---

## 10. Next Steps

### Implementation Checklist

- [ ] Update database schema (add status fields)
- [ ] Create `AdminCreateContractModal` component
- [ ] Update `MilestoneCard` with new UI
- [ ] Enhance `EvidenceUploadModal` with IoT & AI
- [ ] Build AI milestone generation API
- [ ] Integrate crop health AI model
- [ ] Create farmer onboarding flow
- [ ] Build admin approval interface
- [ ] Implement blockchain traceability
- [ ] Create consumer QR scanning app
- [ ] Test complete workflow end-to-end

### Testing Scenarios

1. **Admin creates contract for new farmer**
2. **Farmer uploads evidence with photos + IoT**
3. **Officer verifies and payment releases**
4. **Consumer scans QR and views journey**
5. **Admin rejects farmer application**
6. **AI generates milestones for different crops**

---

## Conclusion

This updated workflow provides:
- **Better control** for admins
- **Higher quality** evidence with IoT and AI
- **Complete transparency** via blockchain
- **Consumer trust** through traceability
- **Professional UI** matching your design

**All evidence (photos, IoT, AI diagnostics) is logged on the blockchain and viewable when consumers scan QR codes, creating complete farm-to-table transparency.**
