
'use server';

/**
 * @fileOverview An AI chat assistant that answers user questions about MintFire's products and services,
 * using product data from products.json for accuracy.
 *
 * - chatAssistant - A function that handles the chat assistant process.
 * - ChatAssistantInput - The input type for the chatAssistant function.
 * - ChatAssistantOutput - The return type for the chatAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import fs from 'fs/promises';
import path from 'path';
import { ProductListSchema, type Product } from '@/lib/schemas/product-schemas';

const productsFilePath = path.join(process.cwd(), 'data', 'products.json');

async function getProductsForAI(): Promise<Product[]> {
  try {
    await fs.mkdir(path.dirname(productsFilePath), { recursive: true });
    let fileContent: string;
    try {
      fileContent = await fs.readFile(productsFilePath, 'utf-8');
    } catch (readError: any) {
      if (readError.code === 'ENOENT') {
        await fs.writeFile(productsFilePath, JSON.stringify([]), 'utf-8');
        return [];
      }
      throw readError;
    }
    if (fileContent.trim() === '') {
      return [];
    }
    const items = JSON.parse(fileContent);
    return ProductListSchema.parse(items);
  } catch (error) {
    console.error("Error reading or parsing products.json for AI:", error);
    return []; // Return empty list on error to prevent AI failure
  }
}


const ChatAssistantInputSchema = z.object({
  query: z.string().describe('The user query about the company products and services.'),
});
export type ChatAssistantInput = z.infer<typeof ChatAssistantInputSchema>;

const ChatAssistantOutputSchema = z.object({
  response: z.string().describe('The response to the user query.'),
});
export type ChatAssistantOutput = z.infer<typeof ChatAssistantOutputSchema>;

// Internal schema for the prompt, including product data
const PromptInputSchema = ChatAssistantInputSchema.extend({
  products: ProductListSchema.describe("A list of available MintFire products with their details."),
});
type PromptInput = z.infer<typeof PromptInputSchema>;


export async function chatAssistant(input: ChatAssistantInput): Promise<ChatAssistantOutput> {
  return chatAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatAssistantPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: PromptInputSchema}, // Use the extended schema here
  output: {schema: ChatAssistantOutputSchema},
  prompt: `You are an AI chat assistant for MintFire, a company specializing in Cyber Security, Blockchain, AI, Industrial Software, and IoT Devices.

Your primary goal is to answer user questions accurately and politely based *only* on the information provided about MintFire and its products.

Available MintFire Products:
{{#if products.length}}
{{#each products}}
- Name: {{this.name}}
  Description: {{this.description}}
  Status: {{this.status}}
  {{#if this.version}}Version: {{this.version}}{{/if}}
  {{#if this.releaseDate}}Release Date: {{this.releaseDate}}{{/if}}
  Developer: {{this.developer}}
  Pricing Type: {{this.pricingType}}
  Pricing Term: {{this.pricingTerm}}
  {{#if this.priceAmount}}Lifetime Price: \${{this.priceAmount}}{{/if}}
  {{#if this.monthlyPrice}}Monthly Price: \${{this.monthlyPrice}}{{/if}}
  {{#if this.sixMonthPrice}}6-Month Price: \${{this.sixMonthPrice}}{{/if}}
  {{#if this.annualPrice}}Annual Price: \${{this.annualPrice}}{{/if}}
  {{#if this.trialDuration}}Trial Duration: {{this.trialDuration}}{{#if this.postTrialPriceAmount}} (then \${{this.postTrialPriceAmount}}/{{this.postTrialBillingInterval}}){{/if}}{{/if}}
  {{#if this.tags.length}}Tags: {{#each this.tags}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
  {{#if this.couponDetails}}Coupon: {{this.couponDetails}}{{/if}}
  {{#if this.activationDetails}}Activation: {{this.activationDetails}}{{/if}}
  Product URL: {{#if this.productUrl}}{{this.productUrl}}{{else}}Not available{{/if}}
  
{{/each}}
{{else}}
I currently do not have specific product data available.
{{/if}}

User's Query: "{{query}}"

Instructions:
1.  First, determine if the user's query is relevant to MintFire, its services (Cyber Security, Blockchain, AI, Industrial Software, IoT Devices), or the products listed above.
2.  If the query is NOT relevant to MintFire or its offerings, politely state: "I can only answer questions about MintFire and its products or services. How can I help you with that?" Do not attempt to answer off-topic questions.
3.  If the query IS relevant:
    a.  If the user asks about a specific product, use *only* the information from the "Available MintFire Products" list above to answer. Do not invent products or details. If a product is not in the list, state that you don't have information on that specific product but can talk about MintFire's general service areas.
    b.  Only provide detailed workings, technical specifics, or the full long description of a product if the user explicitly asks for them. For general queries, a summary based on the product's short description is sufficient.
    c.  For general questions about MintFire or its service areas, answer concisely and professionally.
4.  Be polite, helpful, and act as a professional company representative.
5.  If asked about a product's pricing, provide all relevant pricing details clearly (e.g., "Product X is a Paid subscription with options for \${{monthlyPrice}}/month, \${{sixMonthPrice}}/6 months, or \${{annualPrice}}/year.").
6.  If asked for a product URL and it's available, provide it.

Based on these instructions and the provided product data, generate a response to the user's query.
`,
});

const chatAssistantFlow = ai.defineFlow(
  {
    name: 'chatAssistantFlow',
    inputSchema: ChatAssistantInputSchema, // External input is just the query
    outputSchema: ChatAssistantOutputSchema,
  },
  async (input) => {
    const products = await getProductsForAI();
    
    const promptInput: PromptInput = {
      query: input.query,
      products: products,
    };

    const result = await prompt(promptInput);
    if (!result.output) {
      console.error(
        'AI chat assistant did not receive the expected output structure from the model.',
        'Input:', input,
        'Products sent to prompt:', products.length,
        'Full Model Response:', result.response // Log the raw response for debugging
      );
      return { response: "I'm sorry, I encountered an issue processing your request. Please try again later." };
    }
    return result.output;
  }
);

