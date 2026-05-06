import { groqGenerate } from './groq';
import { geminiEmbed } from './gemini';

/**
 * Unified AI Interface for Echo.
 * Replaces legacy on-device WebLLM logic with Cloud APIs.
 */

export const ai = {
  /**
   * Sanitizes text by removing PII using Groq.
   */
  async anonymize(content: string): Promise<string> {
    const prompt = `[TASK] Rewrite the following text to remove all Personally Identifiable Information (PII).
[RULES]
- Replace full names with realistic generic names (e.g., "Alex", "Jordan").
- Replace specific addresses with generic ones (e.g., "the park", "my street").
- Replace phone numbers with dummy ones (e.g., "555-0199").
- Replace email addresses with generic placeholders (e.g., "someone@example.com").
- Replace specific dates with generic months or days (e.g., "last Tuesday", "in March").
- Maintain the emotional tone and original length as closely as possible.
- OUTPUT THE SANITIZED TEXT ONLY. Absolutely no preamble, label, explanation, or quotes around it.

[TEXT]
${content}

[SANITIZED TEXT]
`;

    try {
      let sanitized = await groqGenerate(prompt, 1024);

      // Strip any AI preamble the model may have added despite instructions
      sanitized = sanitized
        .replace(/^(here is|here's|sanitized text|sanitized|output)[^:]*:\s*/i, '')
        .replace(/^["']|["']$/g, '') // remove wrapping quotes
        .trim();

      // Fallback: if result is empty OR suspiciously short (< 30% of original), keep original
      if (!sanitized || sanitized.length < content.length * 0.3) {
        console.warn('Anonymization returned unusable result, using original');
        return content;
      }
      return sanitized;
    } catch (error) {
      console.error('AI Anonymization failed:', error);
      return content;
    }
  },

  /**
   * Classifies content safety using Groq.
   */
  async moderate(content: string): Promise<'safe' | 'distress' | 'aggression'> {
    const prompt = `[TASK] Classify the risk level of the text below. Reply with ONLY one word: safe, distress, or aggression. No punctuation. No explanation.

[LABELS]
- distress: self-harm, suicidal ideation, severe emotional crisis, clinical hopelessness
- aggression: hate speech, harassment, threats of violence toward others
- safe: normal expression, shared sadness, frustration, daily struggles

[TEXT]
${content.slice(0, 1000)}

[LABEL]`;

    try {
      const response = await groqGenerate(prompt, 20);
      // Extract only the first word token — handles markdown, punctuation, sentence preambles
      const cleaned = (response.match(/[a-zA-Z]+/)?.[0] ?? '').toLowerCase();

      if (cleaned === 'distress') return 'distress';
      if (cleaned === 'aggression') return 'aggression';
      return 'safe';
    } catch (error) {
      console.error('AI Moderation failed:', error);
      return 'safe';
    }
  },

  /**
   * Detects the emotional tone using Groq.
   */
  async getMood(content: string): Promise<string> {
    const moodList = 'calm, melancholy, hopeful, anxious, grateful, conflicted, numb, tender';
    const prompt = `Classify the mood of this text into exactly one word from this list: ${moodList}. Text: "${content.slice(0, 500)}". Reply with only the single mood word, nothing else.`;
    
    try {
      const response = await groqGenerate(prompt, 10);
      const word = response.toLowerCase().replace(/[^a-z]/g, '');
      const valid = moodList.split(', ');
      return valid.includes(word) ? word : 'Quiet';
    } catch {
      return 'Quiet';
    }
  },

  /**
   * Generates 768-dimensional semantic embedding for text using Gemini.
   */
  async embed(content: string): Promise<number[]> {
    return geminiEmbed(content);
  }
};
