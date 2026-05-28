import { createAdminClient } from '../src/utils/supabase/admin.js';

async function cleanupSubscriptions() {
    const supabase = createAdminClient();
    
    // 1. Get all users
    const { data: users, error: usersError } = await supabase.from('user_profiles').select('id, full_name');
    if (usersError) throw usersError;

    console.log(`Checking ${users.length} users...`);

    for (const user of users) {
        // 2. Get all active subscriptions for this user
        const { data: activeSubs, error: subsError } = await supabase
            .from('subscriptions')
            .select('id, created_at, plan_id, status')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (subsError) {
            console.error(`Error for user ${user.id}:`, subsError);
            continue;
        }

        if (activeSubs && activeSubs.length > 1) {
            console.log(`User ${user.full_name} (${user.id}) has ${activeSubs.length} active subscriptions!`);
            
            // Keep the most recent one (index 0), deactivate others
            const toDeactivate = activeSubs.slice(1).map(s => s.id);
            console.log(`Deactivating: ${toDeactivate.join(', ')}`);
            
            const { error: updateError } = await supabase
                .from('subscriptions')
                .update({ status: 'inactive' })
                .in('id', toDeactivate);
            
            if (updateError) {
                console.error(`Failed to deactivate for ${user.id}:`, updateError);
            } else {
                console.log(`Successfully cleaned up ${user.full_name}`);
            }
        }
    }
}

cleanupSubscriptions().then(() => console.log('Cleanup complete!'));
