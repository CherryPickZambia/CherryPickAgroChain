
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBatch() {
    console.log('Checking batch: B-1GFME82A');
    const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('batch_code', 'B-1GFME82A')
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            console.log('Batch NOT FOUND in database.');
        } else {
            console.error('Error fetching batch:', error.message);
        }
    } else if (data) {
        console.log('Batch FOUND:', JSON.stringify(data, null, 2));
    }
}

checkBatch();
