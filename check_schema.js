
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dmjjmdthanlbsjkizrlz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtamptZHRoYW5sYnNqa2l6cmx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MjMxNDAsImV4cCI6MjA3Nzk5OTE0MH0.UocGwJFmRIF-sfYHznsuu2XZKJ9BwtUCPYk_3gTgPhs';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const tables = ['supply_demands', 'farmer_bids', 'growth_activities', 'farmers'];

    for (const table of tables) {
        console.log(`--- Checking table: ${table} ---`);
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
