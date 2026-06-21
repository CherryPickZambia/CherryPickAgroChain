const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const env = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
  const match = line.match(/^([^#=][^=]*)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function esc(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function main() {
  console.log('Reading from:', supabaseUrl);

  const { data: admins, error: adminError } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'admin');

  if (adminError) {
    console.error('Failed to read users:', adminError.message);
    process.exit(1);
  }

  if (!admins || admins.length === 0) {
    console.error('No admin users found in old database.');
    process.exit(1);
  }

  console.log(`Found ${admins.length} admin user(s):`);
  for (const admin of admins) {
    console.log(`  - ${admin.name} | ${admin.wallet_address} | ${admin.email || 'no email'}`);
  }

  const wallets = admins.map((a) => a.wallet_address).filter(Boolean);
  const farmers = [];
  const officers = [];
  const payments = [];

  for (const wallet of wallets) {
    const { data: farmerRows } = await supabase.from('farmers').select('*').eq('wallet_address', wallet);
    if (farmerRows?.length) farmers.push(...farmerRows);

    const { data: officerRows } = await supabase
      .from('extension_officers')
      .select('*')
      .eq('wallet_address', wallet);
    if (officerRows?.length) officers.push(...officerRows);

    const { data: paymentRows } = await supabase
      .from('payments')
      .select('*')
      .or(`to_address.eq.${wallet},from_address.eq.${wallet}`)
      .order('created_at', { ascending: false })
      .limit(100);
    if (paymentRows?.length) payments.push(...paymentRows);
  }

  const lines = [
    '-- =============================================================================',
    '-- Migrate admin account(s) from OLD Supabase → NEW Supabase',
    '-- Run AFTER supabase/agrochain360_new_project.sql',
    `-- Exported from: ${supabaseUrl}`,
    `-- Generated: ${new Date().toISOString()}`,
    '-- =============================================================================',
    '',
  ];

  for (const user of admins) {
    lines.push('-- Admin user');
    lines.push(
      'INSERT INTO users (id, wallet_address, role, name, email, phone, location, verified, created_at, updated_at)'
    );
    lines.push(
      `VALUES (${[
        user.id,
        user.wallet_address,
        user.role,
        user.name,
        user.email,
        user.phone,
        user.location,
        user.verified,
        user.created_at,
        user.updated_at,
      ]
        .map(esc)
        .join(', ')})`
    );
    lines.push(
      'ON CONFLICT (wallet_address) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone, location = EXCLUDED.location, verified = EXCLUDED.verified, updated_at = NOW();'
    );
    lines.push('');
  }

  if (farmers.length) {
    lines.push('-- Linked farmer profile(s) for admin wallet(s)');
    for (const farmer of farmers) {
      lines.push(
        `INSERT INTO farmers (id, user_id, wallet_address, name, email, phone, location_lat, location_lng, location_address, farm_size, verified, status) VALUES (${[
          farmer.id,
          farmer.user_id,
          farmer.wallet_address,
          farmer.name,
          farmer.email,
          farmer.phone,
          farmer.location_lat,
          farmer.location_lng,
          farmer.location_address,
          farmer.farm_size,
          farmer.verified,
          farmer.status,
        ]
          .map(esc)
          .join(', ')}) ON CONFLICT (wallet_address) DO NOTHING;`
      );
    }
    lines.push('');
  }

  if (officers.length) {
    lines.push('-- Linked extension officer profile(s) for admin wallet(s)');
    for (const officer of officers) {
      lines.push(
        `INSERT INTO extension_officers (id, user_id, wallet_address, name, email, phone, location, location_lat, location_lng, is_active, is_available) VALUES (${[
          officer.id,
          officer.user_id,
          officer.wallet_address,
          officer.name,
          officer.email,
          officer.phone,
          officer.location,
          officer.location_lat,
          officer.location_lng,
          officer.is_active ?? true,
          officer.is_available ?? officer.is_active ?? true,
        ]
          .map(esc)
          .join(', ')}) ON CONFLICT (wallet_address) DO NOTHING;`
      );
    }
    lines.push('');
  }

  if (payments.length) {
    lines.push('-- Platform wallet ledger (optional — restores admin K/USDC balance in app)');
    lines.push('-- Skip this section if you only need admin login access.');
    for (const payment of payments) {
      const cols = [
        'id',
        'from_address',
        'to_address',
        'amount',
        'currency',
        'payment_type',
        'reference_id',
        'reference_type',
        'transaction_hash',
        'contract_id',
        'milestone_id',
        'status',
        'confirmed_at',
        'completed_at',
        'created_at',
      ];
      lines.push(
        `INSERT INTO payments (${cols.join(', ')}) VALUES (${cols
          .map((col) => esc(payment[col] ?? null))
          .join(', ')}) ON CONFLICT DO NOTHING;`
      );
    }
    lines.push('');
  }

  lines.push('-- Verify');
  lines.push("SELECT wallet_address, role, name, email FROM users WHERE role = 'admin';");

  const outPath = path.join(__dirname, '..', 'supabase', 'migrate_admin_from_old.sql');
  fs.writeFileSync(outPath, lines.join('\n'));
  console.log(`\nWrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
