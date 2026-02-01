
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Supabase credentials missing in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testNFTFlow() {
    console.log('🚀 Starting end-to-end NFT flow test (CommonJS)...');

    // 1. Create a Test Batch
    const batchCode = `TEST-BATCH-${Date.now()}`;
    console.log(`\n📦 Creating test batch: ${batchCode}`);

    const { data: batch, error: createError } = await supabase
        .from('batches')
        .insert({
            batch_code: batchCode,
            crop_type: 'Test Mangoes',
            farmer_id: null, // Optional for test
            total_quantity: 100,
            quality_grade: 'A',
            // current_status: 'growing'
        })
        .select()
        .single();

    if (createError) {
        console.error('❌ Failed to create batch:', createError);
        process.exit(1);
    }
    console.log('✅ Batch created in Supabase');

    // 2. Call Minting API (Simulating Client)
    console.log('\n🔗 Calling NFT Minting API...');

    const mintPayload = {
        batchCode: batchCode,
        cropType: 'Test Mangoes',
        farmerName: 'Test Farmer',
        quantity: 100,
        qualityGrade: 'A',
        processingMethods: ['Sorted', 'Washed'],
        productionDate: new Date().toISOString().split('T')[0],
        isOrganic: true
    };

    try {
        // Dynamic import for fetch if node version < 18 or verify global
        let fetchFn = global.fetch;
        if (!fetchFn) {
            console.log('Importing node-fetch...');
            fetchFn = (await import('node-fetch')).default;
        }

        // Assuming the dev server is running on localhost:3000
        const response = await fetchFn('http://localhost:3000/api/nft/mint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mintPayload)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || 'API call failed');
        }

        console.log('✅ API Mint Successful!');
        console.log(`   Tx Hash: ${result.transactionHash}`);
        console.log(`   IPFS URL: ${result.metadataUrl}`);

        // 3. Update Batch (Simulating AdminDashboard Client Logic)
        console.log('\n📝 Simulating Client DB Update...');

        const { error: updateError } = await supabase
            .from('batches')
            .update({
                blockchain_tx: result.transactionHash,
                current_status: 'ready_for_distribution',
                updated_at: new Date().toISOString()
            })
            .eq('batch_code', batchCode);

        if (updateError) {
            throw new Error(`Failed to update batch: ${updateError.message}`);
        }
        console.log('✅ Batch updated with Hash');

        // 4. Verification Check (Simulating Traceability View)
        console.log('\n🔍 Verifying Database Record...');

        const { data: verifiedBatch, error: verifyError } = await supabase
            .from('batches')
            .select('batch_code, blockchain_tx, current_status')
            .eq('batch_code', batchCode)
            .single();

        if (verifyError || !verifiedBatch) {
            throw new Error(`Verification failed: ${verifyError?.message}`);
        }

        if (verifiedBatch.blockchain_tx === result.transactionHash) {
            console.log('🎉 SUCCESS: NFT Flow Verified!');
            console.log(`   Batch ${verifiedBatch.batch_code} is linked to ${verifiedBatch.blockchain_tx}`);
        } else {
            console.error('❌ Mismatch: Hash not saved correctly');
        }

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        process.exit(1);
    }
}

testNFTFlow();
