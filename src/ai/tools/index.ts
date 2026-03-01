'use server';
/**
 * @fileOverview Server-side email sending utility using Resend.
 * No longer uses Genkit — plain async function.
 */
import { z } from 'zod';
import { Resend } from 'resend';
import { getAdminApp, adminDb } from '@/lib/firebase-admin';

const NOTIFICATION_EMAIL = 'o.holiadynets@smartwork.pl';

const SendEmailInputSchema = z.object({
    subject: z.string(),
    body: z.string(),
});

const SendEmailOutputSchema = z.object({
    success: z.boolean(),
    message: z.string(),
});

export async function sendEmail(
    input: z.infer<typeof SendEmailInputSchema>
): Promise<z.infer<typeof SendEmailOutputSchema>> {
    let apiKey: string | undefined | null;
    getAdminApp();
    const db = adminDb();

    try {
        const apiKeySnapshot = await db.ref('config/resendApiKey').get();
        if (apiKeySnapshot.exists()) {
            apiKey = apiKeySnapshot.val();
        } else {
            apiKey = process.env.RESEND_API_KEY;
        }
    } catch (dbError) {
        console.warn('Could not fetch Resend API key from DB, falling back to env:', dbError);
        apiKey = process.env.RESEND_API_KEY;
    }

    if (!apiKey) {
        const msg = 'Resend API key not found. Skipping email.';
        console.warn(msg);
        return { success: false, message: msg };
    }

    const resend = new Resend(apiKey);
    try {
        const { data, error } = await resend.emails.send({
            from: 'Baza ST <onboarding@resend.dev>',
            to: [NOTIFICATION_EMAIL],
            subject: input.subject,
            html: input.body,
        });

        if (error) {
            console.error('Resend API error:', error);
            return { success: false, message: `Resend error: ${error.message}` };
        }

        console.log('Email sent:', data);
        return { success: true, message: `Email sent to ${NOTIFICATION_EMAIL}.` };
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('Email send error:', error);
        return { success: false, message: msg };
    }
}
