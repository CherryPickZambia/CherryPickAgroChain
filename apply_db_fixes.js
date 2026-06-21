
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase env vars in .env.local');
}
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
