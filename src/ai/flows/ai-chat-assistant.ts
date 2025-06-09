
'use server';

/**
 * @fileOverview An AI chat assistant that answers user questions about the company's products and services.
 *
 * - chatAssistant - A function that handles the chat assistant process.
 * - ChatAssistantInput - The input type for the chatAssistant function.
 * - ChatAssistantOutput - The return type for the chatAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatAssistantInputSchema = z.object({
  query: z.string().describe('The user query about the company products and services.'),
});
export type ChatAssistantInput = z.infer<typeof ChatAssistantInputSchema>;

const ChatAssistantOutputSchema = z.object({
  response: z.string().describe('The response to the user query.'),
});
export type ChatAssistantOutput = z.infer<typeof ChatAssistantOutputSchema>;

export async function chatAssistant(input: ChatAssistantInput): Promise<ChatAssistantOutput> {
  return chatAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatAssistantPrompt',
  model: 'googleai/gemini-1.5-flash-latest', // Updated model
  input: {schema: ChatAssistantInputSchema},
  output: {schema: ChatAssistantOutputSchema},
  prompt: `You are an AI chat assistant for MintFire, a company specializing in Cyber Security, Blockchain, AI, and IoT Devices.
  Answer the following question about the company's products and services:

  {{query}}`,
});

const chatAssistantFlow = ai.defineFlow(
  {
    name: 'chatAssistantFlow',
    inputSchema: ChatAssistantInputSchema,
    outputSchema: ChatAssistantOutputSchema,
  },
  async input => {
    const result = await prompt(input); // Get the full result object
    if (!result.output) {
      console.error(
        'AI chat assistant did not receive the expected output structure from the model.',
        'Input:', input,
        'Full Model Response:', result.response // Log the raw response for debugging
      );
      // Provide a fallback error message in the expected structure
      return { response: "I'm sorry, I encountered an issue processing your request. Please try again later." };
    }
    return result.output; // Now it's safer, as we've checked result.output
  }
);

