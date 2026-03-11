const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBiddingSchema() {
    console.log('--- Checking supply_demands table ---');
    let { data: demands, error: demandsError } = await supabase
        .from('supply_demands')
        .select('*')
        .limit(1);

    if (demandsError) {
        console.error('Error fetching supply_demands:', demandsError.message);
    } else {
        console.log('Successfully queried supply_demands.');
        if (demands && demands.length > 0) {
            console.log('Columns found:', Object.keys(demands[0]).join(', '));
        } else {
            console.log('Table exists but is empty.');
        }
    }

    console.log('\n--- Checking farmer_bids table ---');
    let { data: bids, error: bidsError } = await supabase
        .from('farmer_bids')
        .select('*')
        .limit(1);

    if (bidsError) {
        console.error('Error fetching farmer_bids:', bidsError.message);
    } else {
        console.log('Successfully queried farmer_bids.');
        if (bids && bids.length > 0) {
            console.log('Columns found:', Object.keys(bids[0]).join(', '));
        } else {
            console.log('Table exists but is empty.');
        }
    }
}

checkBiddingSchema();
