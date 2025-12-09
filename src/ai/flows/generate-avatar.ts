
'use server';
/**
 * @fileOverview A flow to generate a unique avatar for an employee.
 *
 * - generateAvatar - A function that handles avatar generation.
 * - GenerateAvatarInput - The input type for the generateAvatar function.
 * - GenerateAvatarOutput - The return type for the generateAvatar function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';

const GenerateAvatarInputSchema = z.object({
  fullName: z.string().describe("The employee's full name."),
  jobTitle: z.string().describe("The employee's job title."),
  department: z.string().describe("The employee's department."),
});
export type GenerateAvatarInput = z.infer<typeof GenerateAvatarInputSchema>;

const GenerateAvatarOutputSchema = z.object({
  avatarDataUri: z
    .string()
    .describe('The generated avatar image as a data URI.'),
});
export type GenerateAvatarOutput = z.infer<
  typeof GenerateAvatarOutputSchema
>;

export async function generateAvatar(
  input: GenerateAvatarInput
): Promise<GenerateAvatarOutput> {
  return generateAvatarFlow(input);
}

const generateAvatarFlow = ai.defineFlow(
  {
    name: 'generateAvatarFlow',
    inputSchema: GenerateAvatarInputSchema,
    outputSchema: GenerateAvatarOutputSchema,
  },
  async (input) => {
    const prompt = `Stylized, professional, minimalist avatar of a person.
    Name: ${input.fullName}
    Job title: ${input.jobTitle}
    Department: ${input.department}
    Style: Flat illustration, vector art, vibrant colors, clean lines, abstract representation. No text.`;

    const { media } = await ai.generate({
      model: googleAI.model('imagen-4.0-fast-generate-001'),
      prompt,
      config: {
        aspectRatio: '1:1',
      },
    });

    const imageDataUri = media.url;
    if (!imageDataUri) {
      throw new Error('Image generation failed to return a data URI.');
    }

    return { avatarDataUri: imageDataUri };
  }
);
