
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dmjjmdthanlbsjkizrlz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtamptZHRoYW5sYnNqa2l6cmx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MjMxNDAsImV4cCI6MjA3Nzk5OTE0MH0.UocGwJFmRIF-sfYHznsuu2XZKJ9BwtUCPYk_3gTgPhs';
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
