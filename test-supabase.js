const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseKey?.length);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n=== Testing basic connection ===');
    const { data, error } = await supabase.from('_test').select('*').limit(1);
    if (error) {
      console.log('Connection test result:', error.message);
    } else {
      console.log('Basic connection: OK');
    }
    
    console.log('\n=== Testing table existence ===');
    const tables = [
      'profiles', 
      'app_roles', 
      'locations', 
      'customers', 
      'vehicles', 
      'service_tickets',
      'battery_records'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: exists (${data?.length || 0} sample records)`);
        }
      } catch (e) {
        console.log(`❌ ${table}: ${e.message}`);
      }
    }

    console.log('\n=== Testing profiles/app_roles relationship ===');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          username,
          app_roles(role)
        `)
        .limit(1);
      
      if (error) {
        console.log('❌ Profile/Role relationship:', error.message);
        console.log('This indicates the foreign key is missing between profiles and app_roles');
      } else {
        console.log('✅ Profile/Role relationship: OK');
        console.log('Sample data:', JSON.stringify(data, null, 2));
      }
    } catch (e) {
      console.log('❌ Profile/Role relationship error:', e.message);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testConnection();
