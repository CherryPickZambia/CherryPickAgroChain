const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Client using Anon Key (simulating frontend user)
const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Client using Service Role (Bypasses RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testBiddingRLS() {
    console.log('--- Testing RLS Policies ---');

    // 1. Can Anon read Supply Demands?
    const { data: openDemands, error: demandError } = await supabaseAnon
        .from('supply_demands')
        .select('*')
        .limit(5);

    if (demandError) {
        console.error('❌ Anon read error on supply_demands:', demandError.message);
    } else {
        console.log(`✅ Anon read success on supply_demands. Found ${openDemands.length} rows.`);
    }

    // 2. Can Anon read Farmer Bids?
    // We don't have a guaranteed farmer ID, but we can query all
    const { data: existingBids, error: existingBidsError } = await supabaseAnon
        .from('farmer_bids')
        .select('*')
        .limit(5);

    if (existingBidsError) {
        console.error('❌ Anon read error on farmer_bids:', existingBidsError.message);
    } else {
        console.log(`✅ Anon read success on farmer_bids. Found ${existingBids ? existingBids.length : 0} rows.`);
    }

    // 3. Try to read using the specific joined query from the code
    const testFarmerId = '0x919134626100399ed78D386beA6b27C8E0507b9D'; // Admin address just for testing
    const { data: joinedBids, error: joinedError } = await supabaseAnon
        .from('farmer_bids')
        .select(`*, supply_demand:supply_demands!farmer_bids_supply_demand_id_fkey(title, crop_type, required_quantity, unit, max_price_per_unit, delivery_deadline, status)`)
        .eq('farmer_id', testFarmerId)
        .order('created_at', { ascending: false });

    if (joinedError) {
        console.error('❌ Joined query error (FarmerBiddingPanel):', joinedError);
    } else {
        console.log(`✅ Joined query success.`);
    }
}

testBiddingRLS();
