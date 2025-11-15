const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    console.log('Checking service_tickets table structure...');
    
    // Try to get table info by selecting with LIMIT 0 to see column names
    const { data, error } = await supabase
      .from('service_tickets')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('Error:', error.message);
      return;
    }
    
    console.log('Sample record structure:');
    console.log(JSON.stringify(data, null, 2));
    
    // Also check customers table
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .limit(1);
    
    if (customerError) {
      console.log('Customers error:', customerError.message);
    } else {
      console.log('\nCustomers table structure:');
      console.log(JSON.stringify(customerData, null, 2));
    }
    
  } catch (error) {
    console.error('Check failed:', error);
  }
}

checkSchema();
