import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Initialize Genkit. If no flows are actively defined or used,
// this configuration might still be picked up by the build process.
// It's kept minimal. If all Genkit usage is removed, this file
// and its dependencies in package.json could also be removed.
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash', // Default model, can be changed if Genkit is used
});
