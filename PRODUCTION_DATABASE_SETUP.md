# Production Database & AI Integration Setup

## ✅ Completed

### 1. **Database Infrastructure**
- ✅ Supabase configuration with production credentials
- ✅ Complete marketplace schema (`marketplace_schema_clean.sql`)
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Indexes for optimized queries
- ✅ Triggers for automatic timestamp updates

### 2. **Database Service Layer** (`lib/database.ts`)
- ✅ TypeScript interfaces for all database tables
- ✅ CRUD operations for marketplace listings
- ✅ CRUD operations for marketplace orders
- ✅ Buyer and Farmer profile management
- ✅ Analytics functions for marketplace insights
- ✅ Crop price analytics with aggregations

### 3. **AI Analytics Agent** (`lib/analyticsAgent.ts`)
- ✅ OpenAI Agents SDK integration
- ✅ GPT-5-nano model with reasoning capabilities
- ✅ Web search tool for real-time data
- ✅ Specialized functions:
  - Yield forecasting
  - Market price trend analysis
  - Risk assessment
  - Weather-integrated forecasts
  - AI-powered strategic insights

## 📋 Next Steps to Complete

### 1. **Run Supabase Schema**
Execute the schema in your Supabase SQL Editor:
```bash
# File: supabase/marketplace_schema_clean.sql
```

This will create:
- `farmers` table
- `marketplace_listings` table
- `marketplace_orders` table
- `buyer_profiles` table
- `officers` table
- `officer_verifications` table

### 2. **Update Components to Use Real Data**

#### **Marketplace Component**
Replace mock data with:
```typescript
import { getMarketplaceListings, createMarketplaceOrder } from '@/lib/database';

// In component
const listings = await getMarketplaceListings({ status: 'active' });
```

#### **Buyer Dashboard**
Replace mock orders with:
```typescript
import { getMarketplaceOrders } from '@/lib/database';

const orders = await getMarketplaceOrders(evmAddress);
```

#### **Farmer Dashboard**
Replace mock listings with:
```typescript
import { getFarmerListings, createMarketplaceListing } from '@/lib/database';

const myListings = await getFarmerListings(evmAddress);
```

#### **Advanced Analytics**
Replace mock analytics with AI-powered insights:
```typescript
import { 
  getYieldForecast, 
  getMarketPriceTrends, 
  getRiskAssessment,
  getWeatherForecast,
  getAIInsights 
} from '@/lib/analyticsAgent';

// Get real AI-powered yield forecast
const forecast = await getYieldForecast({
  crop: 'maize',
  region: 'Lusaka',
  season: '2024-2025'
});

// Get market price trends
const priceTrends = await getMarketPriceTrends({
  crop: 'maize',
  timeframe: 'next 3 months'
});

// Get risk assessment
const risks = await getRiskAssessment({
  crop: 'maize',
  region: 'Lusaka',
  factors: ['weather', 'market volatility', 'pests']
});
```

### 3. **Environment Variables**
Ensure all required environment variables are set:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://dmjjmdthanlbsjkizrlz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI for AI Analytics
OPENAI_API_KEY=your_openai_api_key

# CDP for Authentication
NEXT_PUBLIC_CDP_PROJECT_ID=8d885400-2c82-473e-b9d0-bf5c580a9a5f
```

### 4. **Create API Routes for Server-Side Operations**

Create `/app/api/analytics/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getYieldForecast } from '@/lib/analyticsAgent';

export async function POST(request: NextRequest) {
  const { crop, region, season } = await request.json();
  
  const forecast = await getYieldForecast({ crop, region, season });
  
  return NextResponse.json(forecast);
}
```

### 5. **Testing Checklist**

- [ ] Test marketplace listing creation
- [ ] Test order placement and payment flow
- [ ] Test buyer profile creation/update
- [ ] Test farmer profile creation/update
- [ ] Test AI yield forecasting
- [ ] Test AI market price trends
- [ ] Test AI risk assessment
- [ ] Test analytics dashboard with real data

## 🔧 Database Functions to Add

Add these functions to Supabase for better performance:

```sql
-- Update listing quantity after order
CREATE OR REPLACE FUNCTION update_listing_quantity(
  listing_id UUID,
  quantity_sold DECIMAL
)
RETURNS void AS $$
BEGIN
  UPDATE marketplace_listings
  SET available_quantity = available_quantity - quantity_sold
  WHERE id = listing_id;
  
  -- Mark as sold if no quantity left
  UPDATE marketplace_listings
  SET status = 'sold'
  WHERE id = listing_id AND available_quantity <= 0;
END;
$$ LANGUAGE plpgsql;
```

## 📊 Available Database Operations

### Marketplace Listings
- `getMarketplaceListings(filters?)` - Get all listings with optional filters
- `createMarketplaceListing(listing)` - Create new listing
- `updateMarketplaceListing(id, updates)` - Update existing listing
- `getFarmerListings(farmerAddress)` - Get all listings for a farmer

### Marketplace Orders
- `getMarketplaceOrders(buyerAddress?)` - Get orders (optionally filtered by buyer)
- `createMarketplaceOrder(order)` - Create new order
- `updateMarketplaceOrder(id, updates)` - Update order status

### Profiles
- `getBuyerProfile(walletAddress)` - Get buyer profile
- `createOrUpdateBuyerProfile(profile)` - Upsert buyer profile
- `getFarmerProfile(walletAddress)` - Get farmer profile
- `createOrUpdateFarmerProfile(profile)` - Upsert farmer profile

### Analytics
- `getMarketplaceAnalytics()` - Get overall marketplace statistics
- `getCropPriceAnalytics(cropType?)` - Get price analytics by crop type

### AI-Powered Analytics
- `getYieldForecast({ crop, region, season })` - AI yield predictions
- `getMarketPriceTrends({ crop, timeframe })` - AI market analysis
- `getRiskAssessment({ crop, region, factors })` - AI risk analysis
- `getWeatherForecast({ region, crop })` - Weather impact analysis
- `getAIInsights({ farmerId, cropType, historicalData })` - Strategic insights

## 🚀 Production Deployment

1. **Verify Supabase Schema**: Ensure all tables are created
2. **Test Database Connections**: Verify Supabase client works
3. **Enable RLS Policies**: Configure proper security policies
4. **Test AI Agent**: Verify OpenAI API key works
5. **Update Components**: Replace all mock data with real database calls
6. **Deploy to Vercel**: Push changes and deploy

## 📝 Notes

- All database operations include error handling
- Supabase RLS is enabled for security
- AI analytics use GPT-5-nano with reasoning capabilities
- Web search tool provides real-time market data
- All timestamps are automatically managed by triggers
