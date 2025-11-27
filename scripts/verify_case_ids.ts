import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    // Get all battery cases
    const { data: allCases, error: casesError } = await supabase
        .from('battery_cases')
        .select('id, service_ticket_id, battery_record_id, status');

    if (casesError) {
        console.error('Error fetching all cases:', casesError);
    } else {
        console.log('\n=== ALL BATTERY CASES IN DATABASE ===');
        console.log('Total:', allCases?.length);
        allCases?.forEach(c => {
            console.log(`ID: ${c.id}`);
            console.log(`  Ticket: ${c.service_ticket_id}`);
            console.log(`  Record: ${c.battery_record_id}`);
            console.log(`  Status: ${c.status}`);
            console.log('');
        });
    }

    // Check the specific IDs we're looking for
    const lookingFor = [
        "89c673c7-1fd5-4d2f-997a-cd2f3934f941",
        "79047b4e-ed49-4be7-b072-ebe2068e0286"
    ];

    console.log('\n=== SEARCHING FOR SPECIFIC IDS ===');
    for (const id of lookingFor) {
        const { data, error } = await supabase
            .from('battery_cases')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.log(`ID ${id}: NOT FOUND (${error.message})`);
        } else {
            console.log(`ID ${id}: FOUND`);
            console.log(JSON.stringify(data, null, 2));
        }
    }
}

checkData();
