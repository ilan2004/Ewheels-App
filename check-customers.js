const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCustomersSchema() {
  console.log('Checking actual database schema by trying different column combinations...');
  
  const possibleColumns = [
    'id, name, email, address',
    'id, name, contact, email, address', 
    'id, name, phone, email, address',
    'id, name, email, address, created_at',
    'id, name, contact, email, address, vehicle_reg_no, created_at, updated_at'
  ];
  
  for (const columns of possibleColumns) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(columns)
        .limit(1);
      
      if (!error) {
        console.log(`✅ Working columns: ${columns}`);
        console.log('Sample data:', JSON.stringify(data, null, 2));
        break;
      } else {
        console.log(`❌ Failed columns: ${columns} - ${error.message}`);
      }
    } catch (e) {
      console.log(`❌ Error with columns: ${columns} - ${e.message}`);
    }
  }
  
  // Also check service_tickets columns
  console.log('\nChecking service_tickets columns...');
  const ticketColumns = [
    'id, ticket_number, customer_id, symptom, status',
    'id, ticket_number, customer_id, customer_complaint, symptom, status',
    'id, ticket_number, customer_id, vehicle_reg_no, symptom, status'
  ];
  
  for (const columns of ticketColumns) {
    try {
      const { data, error } = await supabase
        .from('service_tickets')
        .select(columns)
        .limit(1);
      
      if (!error) {
        console.log(`✅ Service tickets working columns: ${columns}`);
        break;
      } else {
        console.log(`❌ Service tickets failed: ${columns} - ${error.message}`);
      }
    } catch (e) {
      console.log(`❌ Service tickets error: ${columns} - ${e.message}`);
    }
  }
}

checkCustomersSchema();
