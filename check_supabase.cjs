const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local because dotenv might not be installed
function loadEnv() {
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return {};
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.join('=').trim();
        }
    });
    return env;
}

const env = loadEnv();
const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function checkColumn() {
    console.log('Checking platform_settings table...');
    try {
        const { data, error } = await supabase
            .from('platform_settings')
            .select('favicon_url')
            .limit(1);

        if (error) {
            console.error('Error fetching favicon_url:', error.message);
            if (error.message.includes('column') && error.message.includes('not found')) {
                console.log('STATUS: COLUMN_MISSING');
            } else {
                console.log('STATUS: OTHER_ERROR');
            }
        } else {
            console.log('SUCCESS: Column exists and is accessible.');
            console.log('STATUS: COLUMN_EXISTS');
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkColumn();
