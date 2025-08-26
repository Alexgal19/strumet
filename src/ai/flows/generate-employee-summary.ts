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

const GenerateEmployeeSummaryInputSchema = z.object({
  fullName: z.string().describe("The full name of the employee."),
  hireDate: z.string().describe('The hire date of the employee.'),
  jobTitle: z.string().describe('The job title of the employee.'),
  department: z.string().describe('The department of the employee.'),
  manager: z.string().describe('The manager of the employee.'),
  cardId: z.string().describe('The card ID of the employee.'),
  nationality: z.string().describe('The nationality of the employee.'),
  lockerNumber: z.string().describe('The locker number of the employee.'),
  departmentLockerNumber: z.string().describe('The department locker number of the employee.'),
  sealNumber: z.string().describe('The seal number of the employee.'),
});
export type GenerateEmployeeSummaryInput = z.infer<typeof GenerateEmployeeSummaryInputSchema>;

const GenerateEmployeeSummaryOutputSchema = z.object({
  summary: z.string().describe('A summary of the employee information.'),
});
export type GenerateEmployeeSummaryOutput = z.infer<typeof GenerateEmployeeSummaryOutputSchema>;

export async function generateEmployeeSummary(input: GenerateEmployeeSummaryInput): Promise<GenerateEmployeeSummaryOutput> {
  return generateEmployeeSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEmployeeSummaryPrompt',
  input: {schema: GenerateEmployeeSummaryInputSchema},
  output: {schema: GenerateEmployeeSummaryOutputSchema},
  prompt: `You are an HR assistant. Generate a concise summary of the employee using the provided information in Polish.

Employee Information:
Name: {{fullName}}
Hire Date: {{hireDate}}
Job Title: {{jobTitle}}
Department: {{department}}
Manager: {{manager}}
Card ID: {{cardId}}
Nationality: {{nationality}}
Locker Number: {{lockerNumber}}
Department Locker Number: {{departmentLockerNumber}}
Seal Number: {{sealNumber}}`,
});

const generateEmployeeSummaryFlow = ai.defineFlow(
  {
    name: 'generateEmployeeSummaryFlow',
    inputSchema: GenerateEmployeeSummaryInputSchema,
    outputSchema: GenerateEmployeeSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
