import { NextResponse } from 'next/server';
import { sendEmail } from '@/utils/sendEmail';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ success: false, error: 'البريد الإلكتروني مطلوب' }, { status: 400 });
        }

        const result = await sendEmail({
            to: email,
            subject: 'بينجو - رسالة تجريبية من إعدادات SMTP',
            html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #4CAF50;">تم الاتصال بنجاح!</h2>
                <p>هذه رسالة تجريبية من منصة بينجو.</p>
                <p>إذا كنت تقرأ هذه الرسالة، فهذا يعني أن إعدادات SMTP الخاصة بك تعمل بشكل صحيح.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #888;">الرجاء عدم الرد على هذه الرسالة.</p>
            </div>
            `,
            text: 'تم الاتصال بنجاح! هذه رسالة تجريبية من منصة بينجو. إذا كنت تقرأ هذه الرسالة، فهذا يعني أن إعدادات SMTP الخاصة بك تعمل بشكل صحيح.'
        });

        if (result.success) {
            return NextResponse.json({ success: true, messageId: result.messageId });
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Test SMTP API Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'حدث خطأ غير معروف' }, { status: 500 });
    }
}
