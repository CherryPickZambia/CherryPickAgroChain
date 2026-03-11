
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://dmjjmdthanlbsjkizrlz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtamptZHRoYW5sYnNqa2l6cmx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MjMxNDAsImV4cCI6MjA3Nzk5OTE0MH0.UocGwJFmRIF-sfYHznsuu2XZKJ9BwtUCPYk_3gTgPhs';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runSql(filePath) {
    console.log(`Reading SQL file: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');

    // Note: Supabase JS client doesn't have a direct 'run sql' method for arbitrary SQL strings
    // due to security. However, for this environment, we are using the service role or 
    // we would usually use a migration tool. 
    // Since I cannot run raw DDL via the standard client easily without a RPC,
    // I will try to perform the operations using the client's schema builder if possible,
    // or I will assume the user can run these in the dashboard if I fail.
    // HOWEVER, I can try to use a 'rpc' if one exists like 'exec_sql'.

    console.log("Attempting to execute SQL via RPC 'exec_sql'...");
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error(`Error executing ${path.basename(filePath)}:`, error);
        return false;
    }
    console.log(`Successfully executed ${path.basename(filePath)}`);
    return true;
}

// Fallback: If RPC fails (which it likely will if not defined), 
// I will check if I can at least verify table existence and report back.
async function verifyTable(tableName) {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    return !error || error.code !== '42P01'; // 42P01 is undefined_table
}

async function main() {
    // I'll try to run the SQL files provided in the repo
    const sqlFiles = [
        'c:/Users/lisel/OneDrive/Pictures/cherry pick/agrochain360/supabase/fix_missing_tables.sql',
        'c:/Users/lisel/OneDrive/Pictures/cherry pick/agrochain360/supabase/fix_bidding_schema.sql'
    ];

    for (const file of sqlFiles) {
        await runSql(file);
    }
}

main();
