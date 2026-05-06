/**
 * Groq AI Client for high-speed text inference.
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function groqGenerate(
  prompt: string,
  maxTokens: number = 500,
  systemPrompt?: string,
): Promise<string> {
  if (!GROQ_API_KEY) {
    console.error('Groq API key missing');
    return '';
  }

  const messages: { role: string; content: string }[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const attempt = async (): Promise<string> => {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages,
        max_tokens: maxTokens,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as any;
      throw new Error(
        `Groq API error: ${errorData.error?.message || response.statusText}`,
      );
    }

    const data = (await response.json()) as any;
    return data.choices[0]?.message?.content?.trim() ?? '';
  };

  // Retry once on transient failure — critical for safety pipeline
  for (let attempt_n = 0; attempt_n < 2; attempt_n++) {
    try {
      return await attempt();
    } catch (error) {
      if (attempt_n === 1) {
        console.error('Groq generation failed after retry:', error);
        return '';
      }
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  return '';
}
