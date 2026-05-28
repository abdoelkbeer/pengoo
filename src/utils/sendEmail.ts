import nodemailer from 'nodemailer';
import { createAdminClient } from '@/utils/supabase/admin';

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
    try {
        const admin = createAdminClient();

        // Fetch SMTP configuration from database
        const { data: settings, error } = await admin
            .from('platform_settings')
            .select('smtp_host, smtp_port, smtp_user, smtp_password, smtp_sender_email, smtp_sender_name')
            .limit(1)
            .single();

        if (error || !settings) {
            throw new Error('Failed to fetch SMTP configuration or settings not found.');
        }

        const {
            smtp_host,
            smtp_port,
            smtp_user,
            smtp_password,
            smtp_sender_email,
            smtp_sender_name
        } = settings;

        if (!smtp_host || !smtp_user || !smtp_password || !smtp_sender_email) {
            throw new Error('SMTP configuration is incomplete in platform settings.');
        }

        // Configure Nodemailer transporter dynamically
        const transporter = nodemailer.createTransport({
            host: smtp_host,
            port: smtp_port || 587,
            secure: smtp_port === 465, // true for 465, false for other ports
            auth: {
                user: smtp_user,
                pass: smtp_password,
            },
        });

        // Verify connection configuration
        await transporter.verify();

        const fromString = smtp_sender_name ? `"${smtp_sender_name}" <${smtp_sender_email}>` : smtp_sender_email;

        // Send email
        const info = await transporter.sendMail({
            from: fromString,
            to,
            subject,
            text, // plain text body
            html, // html body
        });

        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        console.error('sendEmail Error:', error);
        return { success: false, error: error.message };
    }
}
