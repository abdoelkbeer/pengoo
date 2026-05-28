const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function checkColumn() {
    console.log('Checking platform_settings table...');
    const { data, error } = await supabase
        .from('platform_settings')
        .select('favicon_url')
        .limit(1);

    if (error) {
        console.error('Error fetching favicon_url:', error.message);
        if (error.message.includes('column') && error.message.includes('does not exist')) {
            console.log('STATUS: COLUMN_MISSING');
        } else {
            console.log('STATUS: OTHER_ERROR');
        }
    } else {
        console.log('SUCCESS: Column exists and is accessible.');
        console.log('Data sample:', data);
        console.log('STATUS: COLUMN_EXISTS');
    }
}

checkColumn();
