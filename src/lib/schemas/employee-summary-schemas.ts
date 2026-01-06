
import {z} from 'genkit';


/**
 * @fileOverview Schemas and types for the employee summary generation flow.
 */

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
