import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: logs, error } = await supabase
        .from('message_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
    console.log(JSON.stringify(logs, null, 2));
}

run();
