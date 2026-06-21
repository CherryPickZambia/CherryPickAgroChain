
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function findCode() {
    const code = 'CP-MAN-241115-A2B3';

    console.log(`Searching for ${code}...`);

    const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('contract_code', code);

    if (contract && contract.length > 0) {
        console.log('Found in contracts table:', contract[0]);
    } else {
        console.log('Not found in contracts table.');
    }

    const { data: batch, error: batchError } = await supabase
        .from('batches')
        .select('*')
        .eq('batch_code', code);

    if (batch && batch.length > 0) {
        console.log('Found in batches table:', batch[0]);
    } else {
        console.log('Not found in batches table.');
    }
}

findCode();
