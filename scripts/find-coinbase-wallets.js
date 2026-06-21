const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const env = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
  const match = line.match(/^([^#=][^=]*)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});

const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const PREFIXES = ['0x0E6c', '0x7Ba8', '0x0e6c', '0x7ba8'];

async function main() {
  const { data: all, error } = await sb
    .from('users')
    .select('wallet_address, role, name, email, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  console.log('=== Wallets matching Coinbase prefixes ===');
  for (const u of all || []) {
    const w = u.wallet_address || '';
    if (PREFIXES.some((p) => w.toLowerCase().startsWith(p.toLowerCase()))) {
      console.log(JSON.stringify(u, null, 2));
    }
  }

  console.log('\n=== Current admin wallets in old DB ===');
  for (const u of all || []) {
    if (u.role === 'admin') console.log(u.wallet_address, '-', u.name);
  }

  console.log('\n=== All wallets (for manual match) ===');
  for (const u of all || []) {
    console.log(u.role.padEnd(8), u.wallet_address);
  }
}

main().catch(console.error);
