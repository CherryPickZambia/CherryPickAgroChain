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

async function run(label, queryFn) {
  const { data, error } = await queryFn();
  console.log('\n=== ' + label + ' ===');
  if (error) console.error(error.message);
  else console.log(JSON.stringify(data, null, 2));
}

async function main() {
  console.log('URL:', env.NEXT_PUBLIC_SUPABASE_URL);
  await run('All admin users', () => sb.from('users').select('*').eq('role', 'admin'));
  await run('User by L1dobbuku email', () =>
    sb.from('users').select('*').ilike('email', '%L1dobbuku%')
  );
  await run('All users with l1dobb in email', () =>
    sb.from('users').select('*').ilike('email', '%l1dobb%')
  );
  await run('Farmer by L1dobbuku email', () =>
    sb.from('farmers').select('*').ilike('email', '%l1dobb%')
  );
  await run('All users (recent 20)', () =>
    sb.from('users').select('wallet_address, role, name, email, created_at').order('created_at', { ascending: false }).limit(20)
  );
}

main().catch(console.error);
