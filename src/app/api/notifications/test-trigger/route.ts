import { NextResponse } from 'next/server';
import { createNotification } from '@/utils/notifications';
import { createClient } from '@/utils/supabase/server';

/**
 * A testing endpoint to trigger various types of notifications.
 * This can be used to verify UI/UX and real-time delivery.
 */
export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { type } = await req.json();

        let title = '';
        let message = '';
        let link = '';

        switch (type) {
            case 'order':
                title = 'طلب جديد #9842';
                message = 'قام "أحمد محمد" بطلب منتج "ساعة ذكية" بقيمة 1,200 ج.م';
                link = '/dashboard/notifications'; // Placeholder for order details
                break;
            case 'whatsapp':
                title = 'تم قطع اتصال واتساب';
                message = 'يرجى مراجعة صفحة الربط لإعادة الاتصال بالرقم';
                link = '/dashboard/connections';
                break;
            case 'credits':
                title = 'تنبيه: رصيد منخفض';
                message = 'متبقي أقل من 50 كريدت في حسابك. يرجى الشحن لتجنب توقف الخدمة.';
                link = '/dashboard/plans';
                break;
            case 'welcome':
                title = 'أهلاً بك في نظام الإشعارات الجديد';
                message = 'هذا هو النظام الجديد للتنبيهات الفورية من الألف إلى الياء. بريميوم وفعّال!';
                break;
            default:
                title = 'تنبيه نظام';
                message = 'هذا إشعار تجريبي لاختبار النظام.';
        }

        const notification = await createNotification({
            userId: user.id,
            type: type === 'whatsapp' || type === 'credits' ? 'warning' : 'success',
            title,
            message,
            link
        });

        return NextResponse.json({ success: true, notification });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
