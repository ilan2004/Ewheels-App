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

async function checkAssignments() {
    // 1. Get all battery cases
    const { data: cases, error: casesError } = await supabase
        .from('battery_cases')
        .select('id, service_ticket_id');

    if (casesError) {
        console.error('Error fetching cases:', casesError);
        return;
    }

    console.log('Total Battery Cases:', cases?.length);

    if (!cases || cases.length === 0) {
        console.log('No battery cases found.');
        return;
    }

    // 2. Get the tickets linked to these cases
    const ticketIds = cases.map(c => c.service_ticket_id);
    const { data: tickets, error: ticketsError } = await supabase
        .from('service_tickets')
        .select('id, ticket_number, assigned_to, battery_case_id')
        .in('id', ticketIds);

    if (ticketsError) {
        console.error('Error fetching tickets:', ticketsError);
        return;
    }

    console.log('Linked Tickets:', tickets?.length);

    // 3. Print the assignments
    tickets?.forEach(t => {
        console.log(`Ticket ${t.ticket_number} (ID: ${t.id}) is assigned to: ${t.assigned_to}`);
        console.log(`  Linked Battery Case: ${t.battery_case_id}`);
    });

    // 4. Check if there are any tickets with battery_case_id that are NOT in the cases list (orphans)
    // (The previous migration should have cleaned these up, but let's verify)
    const { count: orphanCount, error: orphanError } = await supabase
        .from('service_tickets')
        .select('*', { count: 'exact', head: true })
        .not('battery_case_id', 'is', null)
        .not('battery_case_id', 'in', `(${cases.map(c => c.id).join(',')})`);

    if (orphanError) {
        // If the list is empty, the IN clause might be invalid, so ignore error if cases is empty
        console.log('Error checking orphans (might be empty list):', orphanError.message);
    } else {
        console.log('Orphaned Tickets (referencing non-existent cases):', orphanCount);
    }
}

checkAssignments();
