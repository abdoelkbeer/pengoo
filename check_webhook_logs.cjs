const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let value = match[2] ? match[2].trim() : '';
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
        }
        env[match[1]] = value;
    }
});

const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
    const { data: logs, error } = await supabase
        .from('message_logs')
        .select('id, recipient_phone, message_body, status, external_id, sent_at')
        .order('id', { ascending: false }) // Sort by uuid or default ordering
        .limit(10);

    if (error) {
        console.error('Failed to query logs:', error);
    } else {
        console.log('LATEST LOGS:', JSON.stringify(logs, null, 2));
    }
}

run();
