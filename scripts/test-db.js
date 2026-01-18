
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually since we might not have dotenv configured for this script context
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2].trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

console.log('Testing connection to:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  try {
    // 1. Test basic connection by fetching users count or something simple
    const { count, error: countError } = await supabase.from('users').select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Connection failed:', countError);
    } else {
      console.log('Connection successful. User count:', count);
    }

    // 2. Find user by email
    const email = 'cherrypickzambia@gmail.com';
    console.log(`Searching for user with email: ${email}`);
    
    const { data: users, error: searchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    if (searchError) {
      console.error('Error searching for user:', searchError);
    } else if (users && users.length > 0) {
      console.log('User found:', users[0]);
      console.log('Wallet Address:', users[0].wallet_address);
      
      // Optional: Update user role to admin in DB if found
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', users[0].id);
        
      if (updateError) {
        console.error('Error updating user role to admin:', updateError);
      } else {
        console.log('Successfully updated user role to admin in database.');
      }
      
    } else {
      console.log('User not found with that email.');
      // Try searching farmers table
       const { data: farmers, error: farmerSearchError } = await supabase
        .from('farmers')
        .select('*')
        .eq('email', email);
        
       if (farmers && farmers.length > 0) {
           console.log('Found as farmer:', farmers[0]);
           console.log('Wallet Address:', farmers[0].wallet_address);
       }
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

main();
