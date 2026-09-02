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
    smtpHost: z.string().optional(),
    smtpPort: z.number().optional(),
    smtpSecure: z.boolean().optional(),
    smtpUser: z.string().optional(),
    smtpPass: z.string().optional(),
    fromName: z.string().optional(),
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
    let smtpHost: string | undefined | null = input.smtpHost;
    let smtpPort: number | undefined | null = input.smtpPort;
    let smtpSecure: boolean | undefined | null = input.smtpSecure;
    let smtpUser: string | undefined | null = input.smtpUser;
    let smtpPass: string | undefined | null = input.smtpPass;
    let fromName: string | undefined | null = input.fromName;

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
                if (!smtpHost) smtpHost = config.smtpHost;
                if (!smtpPort) smtpPort = config.smtpPort;
                if (smtpSecure === undefined || smtpSecure === null) smtpSecure = config.smtpSecure ?? false;
                if (!smtpUser) smtpUser = config.smtpUser;
                if (!smtpPass) smtpPass = config.smtpPass;
                if (!fromName) fromName = config.fromName;
            }
        } catch (dbError) {
            console.warn('Could not fetch config from DB (or timeout), falling back to env:', dbError);
            if (!gmailUser) gmailUser = process.env.GMAIL_USER;
            if (!gmailAppPassword) gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
        }
    }

    if (recipientEmails.length === 0) {
        const msg = 'No recipient emails configured. Skipping email.';
        console.warn(msg);
        return { success: false, message: msg };
    }

    const hasGmailCreds = Boolean(gmailUser && gmailAppPassword);
    const hasSmtpCreds = Boolean(smtpHost && smtpUser && smtpPass);

    if (!hasGmailCreds && !hasSmtpCreds) {
        const msg = 'Brak danych serwera pocztowego (SMTP lub Gmail). Skonfiguruj wysyłkę w Konfiguracji.';
        console.warn(msg);
        return { success: false, message: msg };
    }

    try {
        let transporter: import('nodemailer').Transporter;
        let fromAddress: string;

        if (hasSmtpCreds) {
            // Uniwersalny SMTP (Outlook / M365 / firmowy serwer)
            transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort || 587,
                secure: smtpSecure ?? false, // false = STARTTLS (587), true = SSL (465)
                auth: {
                    user: smtpUser!,
                    pass: smtpPass!.replace(/\s+/g, ''),
                },
            } as import('nodemailer').TransportOptions);
            fromAddress = smtpUser!;
        } else {
            // Gmail (wsteczna kompatybilność)
            transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: gmailUser,
                    pass: gmailAppPassword!.replace(/\s+/g, ''),
                },
            } as import('nodemailer').TransportOptions);
            fromAddress = gmailUser!;
        }

        const info = await transporter.sendMail({
            from: `"${fromName || 'Strumet HR'}" <${fromAddress}>`,
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
            return {
                success: false,
                message: 'Błąd autoryzacji serwera pocztowego. Sprawdź login i hasło (dla Outlook/M365 — czy włączone SMTP AUTH / hasło aplikacji).',
            };
        }
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
            return { success: false, message: 'Brak połączenia z serwerem SMTP. Sprawdź host i port.' };
        }

        return { success: false, message: msg };
    }
}