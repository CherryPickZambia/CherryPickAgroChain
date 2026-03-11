const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixBalances() {
    // Find recent confirmed deposits for the user account likely affected
    const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('currency', 'ZMW')
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching payments:', error);
        return;
    }

    console.log('Recent Confirmed ZMW Payments:');
    payments.forEach(p => {
        console.log(`ID: ${p.id}, Amount: ${p.amount}, Created: ${p.created_at}, From: ${p.from_address}, To: ${p.to_address}`);
    });

    // Specifically looking for a K10 deposit that shouldn't be there
    const phantom = payments.find(p => p.amount === 10 && p.from_address.includes('momo'));
    if (phantom) {
        console.log(`\nFound potential phantom deposit: ID ${phantom.id}`);
        const { error: deleteError } = await supabase
            .from('payments')
            .delete()
            .eq('id', phantom.id);

        if (deleteError) {
            console.error('Error deleting phantom deposit:', deleteError);
        } else {
            console.log('Successfully deleted phantom deposit. Balance corrected.');
        }
    } else {
        console.log('\nNo K10 phantom deposit found. Check the list manually.');
    }
}

fixBalances();
