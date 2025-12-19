
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAttachments() {
    console.log('Checking ticket attachments...');

    // Get recent attachments with source = 'media_hub'
    const { data: attachments, error } = await supabase
        .from('ticket_attachments')
        .select('*')
        .eq('source', 'media_hub')
        .limit(5);

    if (error) {
        console.error('Error fetching attachments:', error);
        return;
    }

    console.log(`Found ${attachments.length} media_hub attachments.`);

    for (const att of attachments) {
        console.log(`\nAttachment ID: ${att.id}`);
        console.log(`Ticket ID: ${att.ticket_id}`);
        console.log(`Storage Path: ${att.storage_path}`);
        console.log(`Type: ${att.attachment_type}`);
        console.log(`Source: ${att.source}`);
        console.log(`Uploaded By: ${att.uploaded_by}`);

        // Try media-photos
        const bucketPhoto = 'media-photos';
        const { data: signedPhoto, error: errorPhoto } = await supabase.storage
            .from(bucketPhoto)
            .createSignedUrl(att.storage_path, 60);

        if (errorPhoto) {
            console.log(`❌ Failed in ${bucketPhoto}:`, errorPhoto.message);
        } else {
            console.log(`✅ Success in ${bucketPhoto}:`, signedPhoto?.signedUrl?.substring(0, 50) + '...');
        }
    }
}

checkAttachments();
