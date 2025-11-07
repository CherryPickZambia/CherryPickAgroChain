# Cherry Pick - Blockchain Contract Farming Platform

Cherry Pick is a blockchain-enabled smart contract platform designed to digitize, secure, and optimize contract farming for high-value fruits and vegetables.

## Features

- **Smart Contracts**: Blockchain-secured contracts with pre-defined terms and milestones
- **Milestone-Based Payments**: Automatic payments upon verification
- **OEVN (On-Demand Extension Verification Network)**: Uber-style verification system for extension officers
- **QR Code Traceability**: Full farm-to-retail tracking
- **Multi-Crop Support**: Mangoes, Pineapples, Cashew nuts, Tomatoes, Beetroot, Bananas, Pawpaw, Strawberries
- **Base Blockchain Integration**: Built on Coinbase's Base network for fast, low-cost transactions

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Blockchain**: Coinbase CDP SDK, Base Network
- **Wallet**: CDP Embedded Wallets (Email, SMS, OAuth)
- **UI Components**: Lucide Icons, Custom Components

## Getting Started

### Prerequisites

- Node.js 22+ installed
- A Coinbase Developer Platform (CDP) account
- CDP Project ID

### Installation

1. Clone the repository:
```bash
cd agrochain360
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Configure environment variables:
   - Copy `.env.local` and add your CDP Project ID:
```bash
NEXT_PUBLIC_CDP_PROJECT_ID=your-project-id-here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
agrochain360/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── Dashboard.tsx      # Main dashboard
│   ├── FarmerDashboard.tsx
│   ├── OfficerDashboard.tsx
│   ├── AdminDashboard.tsx
│   ├── CreateContractModal.tsx
│   ├── MilestoneCard.tsx
│   ├── Header.tsx
│   └── SignInScreen.tsx
├── lib/                   # Utilities and config
│   ├── config.ts         # App configuration
│   ├── types.ts          # TypeScript types
│   ├── utils.ts          # Utility functions
│   └── theme.ts          # CDP theme config
└── public/               # Static assets
```

## User Roles

### Farmer
- Create smart contracts
- Submit milestone evidence
- Track payments
- View QR codes for traceability

### Extension Officer
- Accept verification tasks via OEVN
- Perform on-site inspections
- Submit verification evidence
- Earn verification fees

### Cherry-Pick Admin
- Monitor all contracts
- View platform analytics
- Manage farmers and officers
- Track crop distribution

## Key Workflows

### 1. Farmer Onboarding & Contract Creation
- Farmer signs in with email/SMS/OAuth
- Creates smart contract with crop details
- System generates milestones and QR code
- Contract is activated on blockchain

### 3. Milestone Verification (OEVN)
- Farmer submits milestone evidence
- System creates verification task
- Nearest extension officer accepts task
- Officer performs on-site verification
- Evidence is submitted and verified

### 5. Payment Processing
- Upon milestone verification
- Smart contract releases payment
- Funds sent to farmer's wallet
- Extension officer receives verification fee

### 7. Harvest & Delivery
- Final milestone verified
- QR code tracks produce
- Processing at Cherry-Pick factory
- Distribution to retail

### 8. QR Traceability
- Consumer scans QR code
- Views farm origin and journey
- Sees farmer profile
- Verifies sustainability

### 9. Processing Integration
- Produce arrives at factory
- QR code scanned
- Batch number assigned
- Processing data recorded

### 11. Retail Distribution
- Products shipped to retailers
- QR codes remain active
- Full transparency maintained
- Consumer trust enhanced

## Supported Crops & Milestones

Each crop has specific milestones:

**Fruits (Mangoes, Pineapples, Pawpaw, Bananas, Strawberries)**:
1. Land preparation completed
2. Planting verified
3. Flowering/fruit set confirmed
4. Pest/disease inspection passed
5. Pre-harvest quality inspection approved
6. Harvest and delivery

**Cashew Nuts (Multi-year)**:
1. Seedling establishment verified
2. Year 1 maintenance
3. Flowering and nut set inspection
4. Pest/disease control adherence
5. Harvest and grading

**Vegetables (Tomatoes, Beetroot)**:
1. Nursery establishment
2. Transplanting into main field
3. First flowering
4. First harvest milestone
5. Final harvest and delivery

## Configuration

### CDP Configuration (`lib/config.ts`)
- Project ID
- Supported authentication methods
- Network settings
- Crop types and milestones

### Theme Configuration (`lib/theme.ts`)
- Brand colors (Green theme for agriculture)
- Border radius
- Typography

## Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Manual Deployment
```bash
npm run build
npm start
```

## Environment Variables

Required:
- `NEXT_PUBLIC_CDP_PROJECT_ID`: Your CDP Project ID from portal.cdp.coinbase.com

## Security

- Wallet secrets encrypted
- Private keys never exposed
- Smart contracts audited
- HTTPS required in production
- Compliant with Zambia's Data Protection Act

## Support

For issues or questions:
- Email: support@cherrypick.com
- Documentation: [Link to docs]
- CDP Portal: https://portal.cdp.coinbase.com

## License

Proprietary - Cherry-Pick Ltd.

## Acknowledgments

- Built with Coinbase Developer Platform
- Base Network for blockchain infrastructure
- Next.js and React for frontend
- Tailwind CSS for styling
