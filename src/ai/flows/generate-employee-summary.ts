'use server';
/**
 * @fileOverview A flow to generate employee summaries based on current data.
 *
 * - generateEmployeeSummary - A function that handles the employee summary generation.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GenerateEmployeeSummaryInputSchema, GenerateEmployeeSummaryOutputSchema, type GenerateEmployeeSummaryInput, type GenerateEmployeeSummaryOutput } from '@/lib/schemas/employee-summary-schemas';
import { adminDb } from '@/lib/firebase-admin';
import { createHash } from 'crypto';


export async function generateEmployeeSummary(input: GenerateEmployeeSummaryInput): Promise<GenerateEmployeeSummaryOutput> {
  return generateEmployeeSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEmployeeSummaryPrompt',
  input: {schema: GenerateEmployeeSummaryInputSchema},
  output: {schema: GenerateEmployeeSummaryOutputSchema},
  prompt: `You are a Senior HR Analyst tasked with creating a professional summary of an employee based on the provided data. The output must be in Polish and strictly adhere to the specified JSON format.

  Generate a concise, professional summary paragraph. Additionally, extract 3-4 key bullet points highlighting the most critical information (e.g., contract end date, legalization status).

  Employee Data:
  - Name: {{fullName}}
  - Hire Date: {{hireDate}}
  - Contract End Date: {{#if contractEndDate}}{{contractEndDate}}{{else}}N/A{{/if}}
  - Job Title: {{jobTitle}}
  - Department: {{department}}
  - Manager: {{manager}}
  - Card ID: {{cardNumber}}
  - Nationality: {{nationality}}
  - Legalization Status: {{#if legalizationStatus}}{{legalizationStatus}}{{else}}N/A{{/if}}
  - Locker Number: {{#if lockerNumber}}{{lockerNumber}}{{else}}N/A{{/if}}
  - Department Locker: {{#if departmentLockerNumber}}{{departmentLockerNumber}}{{else}}N/A{{/if}}
  - Seal Number: {{#if sealNumber}}{{sealNumber}}{{else}}N/A{{/if}}
  `,
});

const generateEmployeeSummaryFlow = ai.defineFlow(
  {
    name: 'generateEmployeeSummaryFlow',
    inputSchema: GenerateEmployeeSummaryInputSchema,
    outputSchema: GenerateEmployeeSummaryOutputSchema,
  },
  async input => {
    const { id, ...dataForHash } = input;
    const inputHash = createHash('sha256').update(JSON.stringify(dataForHash)).digest('hex');

    if (id) {
        try {
            const db = adminDb();
            const snapshot = await db.ref(`employeeSummaries/${id}`).once('value');
            const cachedData = snapshot.val();

            if (cachedData && cachedData.hash === inputHash && cachedData.summary && cachedData.keyPoints) {
                return {
                    summary: cachedData.summary,
                    keyPoints: cachedData.keyPoints
                };
            }
        } catch (error) {
            console.error("Error reading cache:", error);
            // Continue to generation if cache read fails
        }
    }

    const {output} = await prompt(input);
    if (!output) {
      throw new Error("AI failed to generate a summary.");
    }

    if (id) {
        try {
            const db = adminDb();
            await db.ref(`employeeSummaries/${id}`).set({
                ...output,
                hash: inputHash,
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error saving to cache:", error);
        }
    }

    return output;
  }
);
