import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini AI Client for high-performance semantic embeddings.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function geminiEmbed(text: string): Promise<number[]> {
  if (!GEMINI_API_KEY) {
    console.error('Gemini API key missing');
    return new Array(768).fill(0);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);

    const embedding = result.embedding.values;
    
    if (!embedding || embedding.length !== 768) {
      throw new Error(`Unexpected embedding length: ${embedding?.length}`);
    }

    return embedding;
  } catch (error) {
    console.error('Gemini embedding failed:', error);
    throw error;
  }
}
