'use server';
/**
 * @fileOverview A central place for defining AI tools for Genkit.
 * You can add new functions here and export them to be used as tools in AI flows.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Resend } from 'resend';
import { getAdminApp, adminDb } from '@/lib/firebase-admin';

// //////////////////////////////////////////////////////////////////////////////////
// Email Sending Tool
// //////////////////////////////////////////////////////////////////////////////////

const NOTIFICATION_EMAIL = 'o.holiadynets@smartwork.pl';

const SendEmailInputSchema = z.object({
    subject: z.string().describe('The subject of the email.'),
    body: z.string().describe('The HTML body content of the email.'),
});

const SendEmailOutputSchema = z.object({
    success: z.boolean(),
    message: z.string(),
});

/**
 * An exported async function that can be called directly from other server-side code.
 */
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


/**
 * A Genkit tool definition. This can be passed to prompts to allow the AI model
 * to decide when to call this function.
 */
export const sendEmailTool = ai.defineTool(
  {
    name: 'sendEmail',
    description: 'Sends an email using the Resend service. The API key is automatically retrieved from configuration.',
    inputSchema: SendEmailInputSchema,
    outputSchema: SendEmailOutputSchema,
  },
  sendEmail // We reuse the same function logic
);


// You can add more tools here in the future
//
// export const anotherTool = ai.defineTool(
//   {
//     name: 'anotherTool',
//     /* ... */
//   },
//   async (input) => { /* ... */ }
// );
