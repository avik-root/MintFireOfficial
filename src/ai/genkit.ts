import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  // Model should be specified per-operation (e.g. in ai.generate() or ai.definePrompt())
  // The googleAI plugin will use its default model if not specified otherwise.
});

