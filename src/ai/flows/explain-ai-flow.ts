
'use server';
/**
 * @fileOverview A flow to explain a concept using an AI model.
 * - explainConcept - A function that takes a topic and returns an explanation.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

const ExplainConceptInputSchema = z.object({
  topic: z.string().describe('The topic to explain.'),
});

const ExplainConceptOutputSchema = z.object({
  explanation: z.string().describe('The generated explanation.'),
});

export async function explainConcept(
  input: z.infer<typeof ExplainConceptInputSchema>
): Promise<z.infer<typeof ExplainConceptOutputSchema>> {
  return explainConceptFlow(input);
}

const explainConceptFlow = ai.defineFlow(
  {
    name: 'explainConceptFlow',
    inputSchema: ExplainConceptInputSchema,
    outputSchema: ExplainConceptOutputSchema,
  },
  async (input) => {
    const { text } = await ai.generate({
      model: googleAI.model('gemini-1.5-flash-latest'),
      prompt: `Explain the following topic in a few words: ${input.topic}`,
    });

    return { explanation: text };
  }
);
