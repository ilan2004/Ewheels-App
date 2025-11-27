import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyData() {
    const idsToCheck = [
        "eeaf75e1-4edc-4f51-bfe5-9db582745ed8",
        "53000ff1-7dca-4d67-ac98-b41f57b52042",
        "34f7172c-4f1d-492d-b0e3-9d2f9f6dfa89",
        "a651ead0-b403-466f-bcb2-cc99ac3935fb",
        "598f00cc-b6e7-4795-a0ed-2809c2174c3a"
    ];

    console.log('Checking for battery cases with IDs:', idsToCheck);

    const { data, error } = await supabase
        .from('battery_cases')
        .select('*')
        .in('id', idsToCheck);

    if (error) {
        console.error('Error fetching battery cases:', error);
    } else {
        console.log('Found battery cases:', data?.length);
        console.log('Data:', JSON.stringify(data, null, 2));
    }

    // Dump all rows to see what we have
    const { data: allRows, error: allRowsError } = await supabase
        .from('battery_cases')
        .select('*');

    if (allRowsError) {
        console.error('Error fetching all rows:', allRowsError);
    } else {
        console.log('All battery_cases rows:', JSON.stringify(allRows, null, 2));
    }

    // Also check if table exists and has any data
    const { count, error: countError } = await supabase
        .from('battery_cases')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('Error checking table count:', countError);
    } else {
        console.log('Total rows in battery_cases:', count);
    }
}

verifyData();
