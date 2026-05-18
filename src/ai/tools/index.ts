'use server';
/**
 * @fileOverview Server-side email sending utility using Nodemailer.
 */
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { getAdminApp, adminDb } from '@/lib/firebase-admin';

const SendEmailInputSchema = z.object({
    subject: z.string(),
    body: z.string(),
    gmailUser: z.string().optional(),
    gmailAppPassword: z.string().optional(),
    recipientEmails: z.array(z.string()).optional(),
});

const SendEmailOutputSchema = z.object({
    success: z.boolean(),
    message: z.string(),
});

export async function sendEmail(
    input: z.infer<typeof SendEmailInputSchema>
): Promise<z.infer<typeof SendEmailOutputSchema>> {
    let gmailUser: string | undefined | null = input.gmailUser;
    let gmailAppPassword: string | undefined | null = input.gmailAppPassword;
    let recipientEmails: string[] = input.recipientEmails || [];

    if (!gmailUser || !gmailAppPassword || recipientEmails.length === 0) {
        try {
            getAdminApp();
            const db = adminDb();
            
            const fetchWithTimeout = <T>(promise: Promise<T>, ms: number) => {
                return Promise.race([
                    promise,
                    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Firebase DB fetch timeout')), ms))
                ]);
            };

            const configSnapshot = await fetchWithTimeout(db.ref('configPrivate').get(), 5000);
            if (configSnapshot.exists()) {
                const config = configSnapshot.val();
                if (!gmailUser) gmailUser = config.gmailUser || process.env.GMAIL_USER;
                if (!gmailAppPassword) gmailAppPassword = config.gmailAppPassword || process.env.GMAIL_APP_PASSWORD;
                if (recipientEmails.length === 0) recipientEmails = config.recipientEmails || [];
            }
        } catch (dbError) {
            console.warn('Could not fetch config from DB (or timeout), falling back to env:', dbError);
            if (!gmailUser) gmailUser = process.env.GMAIL_USER;
            if (!gmailAppPassword) gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
        }
    }

    if (!gmailUser || !gmailAppPassword) {
        const msg = 'Brak danych logowania Gmail. Skonfiguruj e-mail i hasło aplikacji.';
        console.warn(msg);
        return { success: false, message: msg };
    }

    if (recipientEmails.length === 0) {
        const msg = 'No recipient emails configured. Skipping email.';
        console.warn(msg);
        return { success: false, message: msg };
    }

    try {
        const cleanPassword = gmailAppPassword.replace(/\s+/g, '');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: gmailUser,
                pass: cleanPassword,
            },
        });

        const info = await transporter.sendMail({
            from: `"Strumet HR" <${gmailUser}>`,
            to: recipientEmails.join(', '),
            subject: input.subject,
            html: input.body,
        });

        console.log('Email sent:', info.messageId);
        return { success: true, message: `Email wysłany do ${recipientEmails.join(', ')}.` };
    } catch (error: any) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('Email send error:', error);
        
        if (error.code === 'EAUTH') {
            return { success: false, message: 'Błąd autoryzacji. Sprawdź, czy "Hasło Aplikacji" jest poprawne.' };
        }
        
        return { success: false, message: msg };
    }
}