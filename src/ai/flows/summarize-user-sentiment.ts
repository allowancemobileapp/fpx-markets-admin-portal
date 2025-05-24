'use server';

/**
 * @fileOverview Summarizes user sentiment from a list of complaints.
 *
 * - summarizeUserSentiment - A function that summarizes user complaints.
 * - SummarizeUserSentimentInput - The input type for the summarizeUserSentiment function.
 * - SummarizeUserSentimentOutput - The return type for the summarizeUserSentiment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeUserSentimentInputSchema = z.object({
  complaints: z.array(z.string()).describe('A list of user complaints.'),
});
export type SummarizeUserSentimentInput = z.infer<typeof SummarizeUserSentimentInputSchema>;

const SummarizeUserSentimentOutputSchema = z.object({
  summary: z.string().describe('A summary of the key points from the user complaints.'),
});
export type SummarizeUserSentimentOutput = z.infer<typeof SummarizeUserSentimentOutputSchema>;

export async function summarizeUserSentiment(input: SummarizeUserSentimentInput): Promise<SummarizeUserSentimentOutput> {
  return summarizeUserSentimentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeUserSentimentPrompt',
  input: {schema: SummarizeUserSentimentInputSchema},
  output: {schema: SummarizeUserSentimentOutputSchema},
  prompt: `You are an AI assistant helping to summarize user feedback.

  Given the following list of user complaints, identify the key recurring issues and summarize them in a concise manner. Remove any redudant or duplicate complaints before summarizing. Focus on the core problems users are facing.

  Complaints:
  {{#each complaints}}- {{{this}}}
  {{/each}}`,
});

const summarizeUserSentimentFlow = ai.defineFlow(
  {
    name: 'summarizeUserSentimentFlow',
    inputSchema: SummarizeUserSentimentInputSchema,
    outputSchema: SummarizeUserSentimentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
