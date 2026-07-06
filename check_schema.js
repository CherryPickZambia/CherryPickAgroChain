
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const tables = ['supply_demands', 'farmer_bids', 'growth_activities', 'farmers'];

    for (const table of tables) {
        console.log(`Checking table: ${table}`);
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);

        if (error) {
            console.error(`Error querying ${table}:`, JSON.stringify(error, null, 2));
        } else {
            console.log(`Successfully queried ${table}. Data count: ${data.length}`);
            if (data.length > 0) {
                console.log(`Columns found: ${Object.keys(data[0]).join(', ')}`);
            } else {
                console.log(`Table is empty, cannot easily check columns via select *.`);
            }
        }
    }
}

checkSchema();
