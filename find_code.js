
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dmjjmdthanlbsjkizrlz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtamptZHRoYW5sYnNqa2l6cmx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MjMxNDAsImV4cCI6MjA3Nzk5OTE0MH0.UocGwJFmRIF-sfYHznsuu2XZKJ9BwtUCPYk_3gTgPhs';
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
