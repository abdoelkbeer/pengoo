import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Save profile settings
export async function PUT(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { full_name, phone_number } = body;

        const { error } = await supabase
            .from('user_profiles')
            .update({
                full_name,
                phone_number,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
