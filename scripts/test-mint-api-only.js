
const { createClient } = require('@supabase/supabase-js');

async function testMintAPI() {
    console.log('🚀 Testing NFT Minting API Only...');

    const batchCode = `TEST-MINT-${Date.now()}`;
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
        // Dynamic import for fetch if needed
        let fetchFn = global.fetch;
        if (!fetchFn) {
            console.log('Importing node-fetch...');
            fetchFn = (await import('node-fetch')).default;
        }

        console.log('🔗 Sending request to /api/nft/mint...');
        const response = await fetchFn('http://localhost:3000/api/nft/mint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mintPayload)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            console.error('❌ API Error Response:', result);
            throw new Error(result.error || 'API call failed');
        }

        console.log('✅ API Mint Successful!');
        console.log('---------------------------------------------------');
        console.log(`🆔 Batch Code: ${batchCode}`);
        console.log(`🔗 Transaction Hash: ${result.transactionHash}`);
        console.log(`📄 IPFS Metadata: ${result.metadataUrl}`);
        console.log(`🌍 Explorer URL: ${result.explorerUrl}`);
        console.log('---------------------------------------------------');

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
        process.exit(1);
    }
}

testMintAPI();
