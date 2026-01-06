
'use server';

import { z } from 'zod';
import { Resend } from 'resend';
import { getAdminApp, adminDb } from '@/lib/firebase-admin';

const NOTIFICATION_EMAIL = 'o.holiadynets@smartwork.pl';

const SendEmailInputSchema = z.object({
    subject: z.string().describe('The subject of the email.'),
    body: z.string().describe('The HTML body content of the email.'),
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
        const apiKeySnapshot = await db.ref("config/resendApiKey").get();
        if (apiKeySnapshot.exists()) {
            apiKey = apiKeySnapshot.val();
        } else {
             apiKey = process.env.RESEND_API_KEY;
        }
    } catch (dbError) {
        console.warn("Could not fetch Resend API key from Realtime Database, falling back to environment variable. Error:", dbError);
        apiKey = process.env.RESEND_API_KEY;
    }

    if (!apiKey) {
        const warningMessage = "Resend API key not found in database or environment variables. Skipping email sending.";
        console.warn(warningMessage);
        return {
            success: false,
            message: warningMessage,
        };
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
            return {
                success: false,
                message: `Resend error: ${error.message}`,
            };
        }

        console.log('Email sent successfully:', data);
        return {
            success: true,
            message: `Email sent successfully to ${NOTIFICATION_EMAIL}.`,
        };

    } catch (error) {
        console.error('General error sending email:', error);
        if (error instanceof Error) {
             return {
                success: false,
                message: `An unexpected error occurred: ${error.message}`,
            };
        }
        return {
            success: false,
            message: 'An unexpected error occurred while sending the email.',
        };
    }
}
