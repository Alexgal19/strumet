'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const NOTIFICATION_EMAIL = 'o.holiadynets@smartwork.pl';

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
        console.log('***********************************');
        console.log('--- SIMULATING EMAIL SENDING ---');
        console.log(`Recipient: ${NOTIFICATION_EMAIL}`);
        console.log(`Subject: ${subject}`);
        console.log('--- Body ---');
        console.log(body);
        console.log('-----------------------------------');
        console.log('***********************************');
        
        // In a real application, you would integrate with an email service like
        // SendGrid, Resend, or Nodemailer here.
        // For example:
        //
        // import { Resend } from 'resend';
        // const resend = new Resend(process.env.RESEND_API_KEY);
        // await resend.emails.send({
        //   from: 'onboarding@resend.dev',
        //   to: NOTIFICATION_EMAIL,
        //   subject: subject,
        //   html: body,
        // });

        return {
            success: true,
            message: `Email simulation successful. In a real app, an email would be sent to ${NOTIFICATION_EMAIL}.`,
        };
    }
);
