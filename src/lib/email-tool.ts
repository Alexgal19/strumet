'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Resend } from 'resend';

const NOTIFICATION_EMAIL = 'o.holiadynets@smartwork.pl';

// Initialize Resend with the API key from environment variables
// Make sure to add RESEND_API_KEY to your .env file
const resend = new Resend(process.env.RESEND_API_KEY);


export const sendEmail = ai.defineTool(
    {
        name: 'sendEmail',
        description: 'Sends an email with a reminder about fingerprint appointments.',
        inputSchema: z.object({
            subject: z.string().describe('The subject of the email.'),
            body: z.string().describe('The HTML body content of the email.'),
        }),
        outputSchema: z.object({
            success: z.boolean(),
            message: z.string(),
        }),
    },
    async ({ subject, body }) => {
        try {
            // This now sends a real email using Resend
            const { data, error } = await resend.emails.send({
                from: 'HOL Manager <onboarding@resend.dev>', // IMPORTANT: Replace with your verified domain in Resend
                to: [NOTIFICATION_EMAIL],
                subject: subject,
                html: body,
            });

            if (error) {
                console.error('Resend error:', error);
                return {
                    success: false,
                    message: `Failed to send email: ${error.message}`,
                };
            }

            console.log('Email sent successfully:', data);
            return {
                success: true,
                message: `Email sent successfully to ${NOTIFICATION_EMAIL}.`,
            };

        } catch (error) {
            console.error('Error sending email:', error);
            return {
                success: false,
                message: 'An unexpected error occurred while sending the email.',
            };
        }
    }
);
