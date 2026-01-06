// This file is machine-generated - edit with care!
'use server';
/**
 * @fileOverview A flow to generate employee summaries based on current data.
 *
 * - generateEmployeeSummary - A function that handles the employee summary generation.
 * - GenerateEmployeeSummaryInput - The input type for the generateEmployeeSummary function.
 * - GenerateEmployeeSummaryOutput - The return type for the generateEmployeeSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateEmployeeSummaryInputSchema = z.object({
  fullName: z.string().describe("The full name of the employee."),
  hireDate: z.string().describe('The hire date of the employee.'),
  contractEndDate: z.string().optional().describe('The contract end date of the employee.'),
  jobTitle: z.string().describe('The job title of the employee.'),
  department: z.string().describe('The department of the employee.'),
  manager: z.string().describe('The manager of the employee.'),
  cardNumber: z.string().describe('The card ID of the employee.'),
  nationality: z.string().describe('The nationality of the employee.'),
  legalizationStatus: z.string().optional().describe('The legalization status of the employee.'),
  lockerNumber: z.string().optional().describe('The locker number of the employee.'),
  departmentLockerNumber: z.string().optional().describe('The department locker number of the employee.'),
  sealNumber: z.string().optional().describe('The seal number of the employee.'),
});
export type GenerateEmployeeSummaryInput = z.infer<typeof GenerateEmployeeSummaryInputSchema>;

export const GenerateEmployeeSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise, professional summary of the employee in Polish, formatted as a single paragraph.'),
  keyPoints: z.array(z.string()).describe('A list of 3-4 most important bullet points about the employee.'),
});
export type GenerateEmployeeSummaryOutput = z.infer<typeof GenerateEmployeeSummaryOutputSchema>;

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
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("AI failed to generate a summary.");
    }
    return output;
  }
);
